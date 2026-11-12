import { prisma } from '../../config/database.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../errors/index.js';
import { AUCTION_STATUSES } from '@autobid/config';

export class ProxyBiddingService {
  /**
   * Sets or updates a user's maximum proxy bid for an auction
   */
  static async setProxyBid(auctionId, bidderId, maxAmount) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { vehicle: true }
    });

    if (!auction) {
      throw new NotFoundError('Auction', auctionId);
    }

    if (auction.vehicle.sellerId === bidderId) {
      throw new ForbiddenError('You cannot configure proxy bids on your own vehicle');
    }

    if (auction.status !== AUCTION_STATUSES.LIVE && auction.status !== AUCTION_STATUSES.SCHEDULED) {
      throw new ValidationError(`Cannot set proxy bids on auction with status '${auction.status}'`);
    }

    const currentBid = Number(auction.currentHighestBid);
    const minInc = Number(auction.minimumIncrement);
    const requiredMin = currentBid > 0 ? currentBid + minInc : Number(auction.startingPrice);

    if (maxAmount < requiredMin) {
      throw new ValidationError(`Max proxy bid must be at least $${requiredMin.toLocaleString()}`);
    }

    return prisma.proxyBid.upsert({
      where: {
        auctionId_bidderId: {
          auctionId,
          bidderId
        }
      },
      update: {
        maxAmount,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        auctionId,
        bidderId,
        maxAmount,
        isActive: true
      }
    });
  }

  /**
   * Evaluates active proxy bids inside the locked database transaction loop
   * Automatically places counter-bids when necessary
   */
  static async processProxyCounterBids(tx, auctionId, currentBidAmount, currentWinnerId, minimumIncrement) {
    // Find active proxy bids that can outbid the current price and belong to other bidders
    const eligibleProxies = await tx.proxyBid.findMany({
      where: {
        auctionId,
        isActive: true,
        bidderId: { not: currentWinnerId },
        maxAmount: { gte: currentBidAmount + minimumIncrement }
      },
      orderBy: { maxAmount: 'desc' }
    });

    if (eligibleProxies.length === 0) {
      return null;
    }

    const topProxy = eligibleProxies[0];
    const topProxyMax = Number(topProxy.maxAmount);

    let counterBidAmount = currentBidAmount + minimumIncrement;

    // If there is a second competing proxy bid, drive the price up to the second proxy's max + increment
    if (eligibleProxies.length > 1) {
      const secondProxyMax = Number(eligibleProxies[1].maxAmount);
      const calculatedContestPrice = secondProxyMax + minimumIncrement;
      counterBidAmount = Math.min(topProxyMax, Math.max(counterBidAmount, calculatedContestPrice));
    }

    // Insert automatic counter-bid
    const autoBid = await tx.bid.create({
      data: {
        auctionId,
        bidderId: topProxy.bidderId,
        amount: counterBidAmount,
        isProxyAutoBid: true,
        status: 'ACTIVE'
      }
    });

    // Update auction current price & count
    await tx.auction.update({
      where: { id: auctionId },
      data: {
        currentHighestBid: counterBidAmount,
        bidCount: { increment: 1 }
      }
    });

    return {
      autoBid,
      bidderId: topProxy.bidderId,
      counterAmount: counterBidAmount
    };
  }
}
