import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../../errors/index.js';
import { AUCTION_STATUSES, VEHICLE_STATUSES, ROLES, FEE_SCHEDULE, ANTI_SNIPING_DEFAULTS, getMinimumIncrement } from '@autobid/config';

export class AuctionService {
  /**
   * Creates an auction for an approved vehicle
   */
  static async createAuction(userId, userRoles, data) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId }
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle', data.vehicleId);
    }

    const isOwner = vehicle.sellerId === userId;
    const isManager = userRoles.includes(ROLES.AUCTION_MANAGER) || userRoles.includes(ROLES.ADMINISTRATOR) || userRoles.includes(ROLES.SUPER_ADMINISTRATOR);

    if (!isOwner && !isManager) {
      throw new ForbiddenError('You can only create auctions for vehicles you own or manage');
    }

    // Vehicle must be APPROVED by curation committee before an auction can be created
    if (vehicle.status !== VEHICLE_STATUSES.APPROVED && !userRoles.includes(ROLES.SUPER_ADMINISTRATOR)) {
      throw new ValidationError(
        `Cannot create an auction for vehicle with status '${vehicle.status}'. Vehicle must be 'APPROVED' by the curation committee.`,
        'VEHICLE_NOT_APPROVED'
      );
    }

    // Check if an active auction already exists for this vehicle
    const existing = await prisma.auction.findUnique({
      where: { vehicleId: data.vehicleId }
    });

    if (existing && existing.status !== AUCTION_STATUSES.CANCELLED && existing.status !== AUCTION_STATUSES.ENDED) {
      throw new ConflictError('An active or scheduled auction already exists for this vehicle');
    }

    const minIncrement = data.minimumIncrement || getMinimumIncrement(data.startingPrice);

    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.create({
        data: {
          vehicleId: data.vehicleId,
          startingPrice: data.startingPrice,
          reservePrice: data.reservePrice || null,
          currentHighestBid: 0,
          minimumIncrement: minIncrement,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          originalEndTime: new Date(data.endTime),
          status: AUCTION_STATUSES.SCHEDULED,
          depositRequired: data.depositRequired || FEE_SCHEDULE.DEFAULT_DEPOSIT_HOLD,
          currency: data.currency || 'USD'
        },
        include: {
          vehicle: true
        }
      });

      // Transition vehicle to SCHEDULED status
      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: VEHICLE_STATUSES.SCHEDULED }
      });

      return auction;
    });
  }

  /**
   * Retrieves an auction by ID with detailed bids and participant counts
   */
  static async getAuctionById(id, includeDetails = true) {
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: includeDetails ? {
        vehicle: {
          include: {
            images: {
              orderBy: { displayOrder: 'asc' }
            },
            specifications: true,
            features: true,
            inspections: {
              include: {
                damages: true
              },
              take: 1,
              orderBy: { createdAt: 'desc' }
            },
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                sellerProfile: true,
                dealerProfile: true
              }
            }
          }
        },
        bids: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            bidder: {
              select: {
                id: true,
                firstName: true
              }
            }
          }
        },
        winner: {
          include: {
            winner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      } : {
        vehicle: true
      }
    });

    if (!auction) {
      throw new NotFoundError('Auction', id);
    }

    return auction;
  }

  /**
   * Lists auctions with status filtering and pagination
   */
  static async listAuctions(filters = {}, pagination = { page: 1, limit: 20 }) {
    const { status, make, endingSoon, search } = filters;
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (make) {
      where.vehicle = { make: { equals: make, mode: 'insensitive' } };
    }

    let orderBy = { createdAt: 'desc' };
    if (endingSoon) {
      where.status = AUCTION_STATUSES.LIVE;
      orderBy = { endTime: 'asc' };
    }

    const [total, items] = await Promise.all([
      prisma.auction.count({ where }),
      prisma.auction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          vehicle: {
            include: {
              images: {
                where: { isFeatured: true },
                take: 1
              }
            }
          }
        }
      })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Manually or automatically closes an auction and settles winner
   */
  static async closeAuction(auctionId, reason = 'EXPIRED') {
    return prisma.$transaction(async (tx) => {
      // Lock the auction record
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          bids: {
            take: 1,
            orderBy: { amount: 'desc' },
            include: { bidder: true }
          }
        }
      });

      if (!auction) {
        throw new NotFoundError('Auction', auctionId);
      }

      if (auction.status === AUCTION_STATUSES.SOLD || auction.status === AUCTION_STATUSES.UNSOLD) {
        return auction; // Already closed
      }

      const highestBid = auction.bids[0];
      const hasBids = !!highestBid && Number(highestBid.amount) > 0;
      const reservePrice = auction.reservePrice ? Number(auction.reservePrice) : 0;
      const isReserveMet = !reservePrice || (hasBids && Number(highestBid.amount) >= reservePrice);

      let finalStatus = AUCTION_STATUSES.UNSOLD;
      let vehicleStatus = VEHICLE_STATUSES.UNSOLD;

      if (hasBids && isReserveMet) {
        finalStatus = AUCTION_STATUSES.SOLD;
        vehicleStatus = VEHICLE_STATUSES.PAYMENT_PENDING;

        const winningBidAmount = Number(highestBid.amount);
        const buyerPremium = Math.min(
          FEE_SCHEDULE.BUYER_PREMIUM_MAX_FEE,
          Math.max(FEE_SCHEDULE.BUYER_PREMIUM_MIN_FEE, winningBidAmount * FEE_SCHEDULE.BUYER_PREMIUM_PERCENTAGE)
        );
        const totalAmountDue = winningBidAmount + buyerPremium;

        // Payment deadline: 48 hours from auction close
        const paymentDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

        // Create winner record
        await tx.auctionWinner.create({
          data: {
            auctionId: auction.id,
            winnerId: highestBid.bidderId,
            winningBidAmount,
            buyerPremium,
            totalAmountDue,
            paymentDeadline
          }
        });

        // Mark bid as WON
        await tx.bid.update({
          where: { id: highestBid.id },
          data: { status: 'WON' }
        });
      }

      // Update auction
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: finalStatus,
          reserveMet: isReserveMet
        }
      });

      // Update vehicle status
      await tx.vehicle.update({
        where: { id: auction.vehicleId },
        data: { status: vehicleStatus }
      });

      // Record audit entry
      await tx.auditLog.create({
        data: {
          action: 'AUCTION_END',
          resource: 'AUCTION',
          resourceId: auctionId,
          payload: {
            reason,
            finalStatus,
            winningBidderId: hasBids && isReserveMet ? highestBid.bidderId : null,
            winningAmount: hasBids && isReserveMet ? highestBid.amount : 0
          }
        }
      });

      return updatedAuction;
    });
  }
}
