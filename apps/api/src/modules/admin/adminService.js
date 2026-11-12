import { prisma } from '../../config/database.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../errors/index.js';
import { VEHICLE_STATUSES, AUCTION_STATUSES, ROLES } from '@autobid/config';

export class AdminService {
  /**
   * Retrieves high-level administrative platform metrics
   */
  static async getPlatformOverview() {
    const [
      totalUsers,
      activeUsers,
      vehiclesAwaitingApproval,
      activeAuctions,
      completedAuctions,
      revenueResult,
      recentAuditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.vehicle.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.auction.count({ where: { status: AUCTION_STATUSES.LIVE } }),
      prisma.auction.count({ where: { status: AUCTION_STATUSES.SOLD } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true }
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      })
    ]);

    return {
      metrics: {
        totalUsers,
        activeUsers,
        vehiclesAwaitingApproval,
        activeAuctions,
        completedAuctions,
        totalVolume: Number(revenueResult._sum.amount || 0)
      },
      recentAuditLogs
    };
  }

  /**
   * Lists and searches users with status and role filters
   */
  static async listUsers(filters = {}, pagination = { page: 1, limit: 20 }) {
    const { status, role, search } = filters;
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (role) {
      where.userRoles = { some: { role: { name: role } } };
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          userRoles: {
            include: { role: true }
          }
        }
      })
    ]);

    return {
      items: items.map(u => ({
        ...u,
        roles: u.userRoles.map(ur => ur.role.name)
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Suspends, bans, or reactivates a user with audit logging
   */
  static async updateUserStatus(userId, targetStatus, reason, adminId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } }
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Protect Super Administrators from suspension
    const isSuperAdmin = user.userRoles.some(ur => ur.role.name === ROLES.SUPER_ADMINISTRATOR);
    if (isSuperAdmin) {
      throw new ForbiddenError('Super Administrator accounts cannot be modified or suspended');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { status: targetStatus }
      });

      // Record administrative action
      await tx.adminAction.create({
        data: {
          adminId,
          targetType: 'USER',
          targetId: userId,
          actionType: targetStatus,
          reason
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'USER_SUSPEND',
          resource: 'USER',
          resourceId: userId,
          stateDiff: {
            previousStatus: user.status,
            newStatus: targetStatus,
            reason
          }
        }
      });

      return updated;
    });
  }

  /**
   * Reviews and curates a submitted vehicle listing
   */
  static async curateVehicle(vehicleId, decision, notes, adminId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle', vehicleId);
    }

    let targetStatus = VEHICLE_STATUSES.APPROVED;
    if (decision === 'REJECT') {
      targetStatus = VEHICLE_STATUSES.DRAFT;
    } else if (decision === 'REQUEST_CHANGES') {
      targetStatus = VEHICLE_STATUSES.UNDER_REVIEW;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: targetStatus }
      });

      await tx.adminAction.create({
        data: {
          adminId,
          targetType: 'VEHICLE',
          targetId: vehicleId,
          actionType: `VEHICLE_${decision}`,
          reason: notes || 'Curation decision'
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: decision === 'APPROVE' ? 'VEHICLE_APPROVE' : 'VEHICLE_REJECT',
          resource: 'VEHICLE',
          resourceId: vehicleId,
          stateDiff: {
            previousStatus: vehicle.status,
            newStatus: targetStatus,
            decision,
            notes
          }
        }
      });

      return updated;
    });
  }

  /**
   * Manages an active auction (Extend, Pause, or Cancel)
   */
  static async manageAuction(auctionId, action, params = {}, adminId) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    if (!auction) {
      throw new NotFoundError('Auction', auctionId);
    }

    return prisma.$transaction(async (tx) => {
      let updateData = {};
      let auditAction = 'AUCTION_UPDATE';

      if (action === 'EXTEND') {
        const extraMinutes = Number(params.minutes) || 15;
        const currentEnd = new Date(auction.endTime);
        const newEndTime = new Date(currentEnd.getTime() + extraMinutes * 60 * 1000);

        updateData = {
          endTime: newEndTime,
          status: AUCTION_STATUSES.EXTENDED,
          extensionCount: { increment: 1 }
        };
        auditAction = 'AUCTION_EXTEND';
      } else if (action === 'CANCEL') {
        updateData = {
          status: AUCTION_STATUSES.CANCELLED
        };
        auditAction = 'AUCTION_CANCEL';
      }

      const updated = await tx.auction.update({
        where: { id: auctionId },
        data: updateData
      });

      await tx.adminAction.create({
        data: {
          adminId,
          targetType: 'AUCTION',
          targetId: auctionId,
          actionType: action,
          reason: params.reason || `Admin triggered ${action}`
        }
      });

      return updated;
    });
  }

  /**
   * Lists immutable audit logs
   */
  static async listAuditLogs(filters = {}, pagination = { page: 1, limit: 30 }) {
    const { action, resource, actorId } = filters;
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 30));
    const skip = (page - 1) * limit;

    const where = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (actorId) where.actorId = actorId;

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, email: true }
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
   * Retrieves and updates platform settings
   */
  static async getSettings() {
    return prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    });
  }

  static async updateSetting(key, value, adminId) {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value }
    });
  }
}
