import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';
import { AUCTION_STATUSES, BID_STATUSES } from '@autobid/config';
import { ProxyBiddingService } from './proxyBiddingService.js';
import { logger } from '../../config/logger.js';

export class BiddingService {
  /**
   * Submits a bid inside an ACID transaction with pessimistic row-locking
   */
  static async placeBid({ auctionId, bidderId, amount, ipAddress = null }) {
    return prisma.$transaction(async (tx) => {
      // 1. Acquire exclusive lock on the auction row to serialize concurrent bids
      const auctionRows = await tx.$queryRaw`
        SELECT a.id, a.status, a.current_highest_bid, a.starting_price, a.minimum_increment,
               a.start_time, a.end_time, a.anti_sniping_window_sec, a.anti_sniping_ext_sec,
               a.max_extensions, a.extension_count, a.currency, a.deposit_required, v.seller_id
        FROM auctions a
        JOIN vehicles v ON a.vehicle_id = v.id
        WHERE a.id = ${auctionId}::uuid
        FOR UPDATE
      `;

      if (!auctionRows || auctionRows.length === 0) {
        throw new NotFoundError('Auction', auctionId);
      }

      const auction = auctionRows[0];

      // 2. Validate bidder is not seller
      if (auction.seller_id === bidderId) {
        throw new ForbiddenError('You cannot bid on your own vehicle');
      }

      // 2b. Validate refundable deposit hold if required
      const depositRequired = Number(auction.deposit_required || 0);
      if (depositRequired > 0) {
        const participant = await tx.auctionParticipant.findUnique({
          where: {
            auctionId_userId: { auctionId, userId: bidderId }
          }
        });
        if (!participant || !participant.depositPaid) {
          const validDeposit = await tx.payment.findFirst({
            where: {
              userId: bidderId,
              auctionId,
              type: 'DEPOSIT',
              status: { in: ['AUTHORIZED', 'SUCCEEDED'] }
            }
          });
          if (!validDeposit) {
            throw new ForbiddenError(
              `A verified $${depositRequired.toLocaleString()} pre-authorization deposit hold is required before placing live bids`,
              'DEPOSIT_REQUIRED'
            );
          }
        }
      }

      // 3. Authoritative clock & status checks
      const now = new Date();
      const endTime = new Date(auction.end_time);
      const startTime = new Date(auction.start_time);

      if (now < startTime) {
        throw new ValidationError('Auction has not started yet');
      }

      if (now >= endTime || auction.status === AUCTION_STATUSES.ENDED || auction.status === AUCTION_STATUSES.SOLD) {
        throw new ValidationError('Auction has already ended', 'AUCTION_ENDED');
      }

      if (auction.status !== AUCTION_STATUSES.LIVE && auction.status !== AUCTION_STATUSES.SCHEDULED) {
        throw new ValidationError(`Bidding is not allowed when auction status is '${auction.status}'`);
      }

      // 4. Validate bid amount against current highest bid + increment
      const currentHighest = Number(auction.current_highest_bid) || 0;
      const startingPrice = Number(auction.starting_price) || 0;
      const minIncrement = Number(auction.minimum_increment) || 100;

      const requiredMinimum = currentHighest > 0 ? currentHighest + minIncrement : startingPrice;

      if (amount < requiredMinimum) {
        throw new ValidationError(
          `Bid must be at least $${requiredMinimum.toLocaleString()} (current: $${currentHighest.toLocaleString()}, minimum increment: $${minIncrement.toLocaleString()})`,
          'BID_TOO_LOW'
        );
      }

      // 5. Check Anti-Sniping Soft-Close Window
      let isExtended = false;
      let newEndTime = endTime;
      const timeRemainingMs = endTime.getTime() - now.getTime();
      const antiSnipingWindowMs = (auction.anti_sniping_window_sec || 120) * 1000;
      const extensionMs = (auction.anti_sniping_ext_sec || 120) * 1000;
      const maxExtensions = auction.max_extensions || 10;
      const currentExtensionCount = auction.extension_count || 0;

      if (timeRemainingMs <= antiSnipingWindowMs && currentExtensionCount < maxExtensions) {
        isExtended = true;
        newEndTime = new Date(endTime.getTime() + extensionMs);
      }

      // 6. Mark previous active bids for this auction as OUTBID
      await tx.bid.updateMany({
        where: {
          auctionId,
          status: BID_STATUSES.ACTIVE
        },
        data: {
          status: BID_STATUSES.OUTBID
        }
      });

      // 7. Insert new authoritative Bid
      const bid = await tx.bid.create({
        data: {
          auctionId,
          bidderId,
          amount,
          status: BID_STATUSES.ACTIVE,
          ipAddress
        },
        include: {
          bidder: {
            select: {
              id: true,
              firstName: true
            }
          }
        }
      });

      // 8. Update Auction state
      const updateData = {
        currentHighestBid: amount,
        bidCount: { increment: 1 },
        status: AUCTION_STATUSES.LIVE
      };

      if (isExtended) {
        updateData.endTime = newEndTime;
        updateData.extensionCount = { increment: 1 };
        updateData.status = AUCTION_STATUSES.EXTENDED;
      }

      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: updateData
      });

      // 9. Process any active competing proxy bids
      const proxyResult = await ProxyBiddingService.processProxyCounterBids(
        tx,
        auctionId,
        amount,
        bidderId,
        minIncrement
      );

      // 10. Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: bidderId,
          action: 'BID_PLACED',
          resource: 'AUCTION',
          resourceId: auctionId,
          payload: {
            bidId: bid.id,
            amount,
            isExtended,
            newEndTime: isExtended ? newEndTime.toISOString() : null,
            proxyCounterBidPlaced: !!proxyResult
          }
        }
      });

      return {
        bid,
        auction: updatedAuction,
        isExtended,
        newEndTime: isExtended ? newEndTime : null,
        autoCounterBid: proxyResult ? proxyResult.autoBid : null
      };
    });
  }

  /**
   * Retrieves bid history for an auction
   */
  static async getAuctionBids(auctionId, limit = 50) {
    return prisma.bid.findMany({
      where: { auctionId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        bidder: {
          select: {
            id: true,
            firstName: true
          }
        }
      }
    });
  }
}
