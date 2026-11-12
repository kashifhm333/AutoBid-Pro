import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../errors/index.js';
import { validateVehicleTransition } from './vehicleStateMachine.js';
import { VEHICLE_STATUSES, ROLES } from '@autobid/config';

export class VehicleService {
  /**
   * Creates a vehicle in DRAFT status
   */
  static async createVehicle(sellerId, vehicleData) {
    const existing = await prisma.vehicle.findUnique({
      where: { vin: vehicleData.vin }
    });

    if (existing) {
      throw new ConflictError(`Vehicle with VIN '${vehicleData.vin}' is already registered in the system`);
    }

    return prisma.vehicle.create({
      data: {
        ...vehicleData,
        sellerId,
        status: VEHICLE_STATUSES.DRAFT
      },
      include: {
        images: true
      }
    });
  }

  /**
   * Retrieves vehicle by ID with optional detailed relations
   */
  static async getVehicleById(id, includeDetails = true) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: includeDetails ? {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            sellerProfile: true,
            dealerProfile: true
          }
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        videos: true,
        documents: true,
        specifications: true,
        features: true,
        inspections: {
          include: {
            damages: true
          },
          orderBy: { createdAt: 'desc' }
        },
        auction: {
          select: {
            id: true,
            status: true,
            startingPrice: true,
            currentHighestBid: true,
            minimumIncrement: true,
            bidCount: true,
            startTime: true,
            endTime: true,
            reserveMet: true,
            depositRequired: true
          }
        }
      } : {
        images: true,
        auction: true
      }
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle', id);
    }

    return vehicle;
  }

  /**
   * Updates an editable vehicle draft or details
   */
  static async updateVehicle(id, userId, userRoles, updateData) {
    const vehicle = await this.getVehicleById(id, false);

    const isOwner = vehicle.sellerId === userId;
    const isAdmin = userRoles.includes(ROLES.ADMINISTRATOR) || userRoles.includes(ROLES.SUPER_ADMINISTRATOR);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You can only modify your own vehicle listings');
    }

    // Sellers can only edit DRAFT or UNDER_REVIEW vehicles
    if (isOwner && !isAdmin && vehicle.status !== VEHICLE_STATUSES.DRAFT && vehicle.status !== VEHICLE_STATUSES.UNDER_REVIEW) {
      throw new ForbiddenError(`Cannot modify vehicle details while status is '${vehicle.status}'`);
    }

    return prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        images: true
      }
    });
  }

  /**
   * Transitions vehicle through its lifecycle state machine
   */
  static async transitionStatus(id, targetStatus, userId, userRoles, reason = null) {
    const vehicle = await this.getVehicleById(id, false);

    const isOwner = vehicle.sellerId === userId;
    const isAdmin = userRoles.includes(ROLES.ADMINISTRATOR) || userRoles.includes(ROLES.SUPER_ADMINISTRATOR);

    // Non-admin sellers can only transition status of their own vehicles
    if (!isAdmin && !isOwner) {
      throw new ForbiddenError('You can only change the status of your own vehicle listings');
    }

    validateVehicleTransition(vehicle.status, targetStatus, userRoles);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.vehicle.update({
        where: { id },
        data: { status: targetStatus }
      });

      // Audit status transition
      await tx.auditLog.create({
        data: {
          action: targetStatus === VEHICLE_STATUSES.APPROVED ? 'VEHICLE_APPROVE' :
                  targetStatus === VEHICLE_STATUSES.DRAFT ? 'VEHICLE_REJECT' : 'VEHICLE_SUBMIT',
          resource: 'VEHICLE',
          resourceId: id,
          stateDiff: {
            previousStatus: vehicle.status,
            newStatus: targetStatus,
            reason
          }
        }
      });

      return updated;
    });
  }

  /**
   * Lists vehicles with advanced multi-faceted filtering & pagination
   */
  static async listVehicles(filters = {}, pagination = { page: 1, limit: 20 }) {
    const {
      make,
      model,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      bodyType,
      fuelType,
      transmission,
      status,
      sellerId,
      searchQuery
    } = filters;

    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }
    if (make) {
      where.make = { equals: make, mode: 'insensitive' };
    }
    if (model) {
      where.model = { contains: model, mode: 'insensitive' };
    }
    if (yearMin || yearMax) {
      where.year = {};
      if (yearMin) where.year.gte = Number(yearMin);
      if (yearMax) where.year.lte = Number(yearMax);
    }
    if (bodyType) {
      where.bodyType = bodyType;
    }
    if (fuelType) {
      where.fuelType = fuelType;
    }
    if (transmission) {
      where.transmission = transmission;
    }
    if (sellerId) {
      where.sellerId = sellerId;
    }
    if (searchQuery) {
      where.OR = [
        { make: { contains: searchQuery, mode: 'insensitive' } },
        { model: { contains: searchQuery, mode: 'insensitive' } },
        { vin: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            where: { isFeatured: true },
            take: 1
          },
          auction: {
            select: {
              id: true,
              status: true,
              currentHighestBid: true,
              endTime: true
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
   * Adds an image to a vehicle listing
   */
  static async addVehicleImage(vehicleId, userId, imageData) {
    const vehicle = await this.getVehicleById(vehicleId, false);
    if (vehicle.sellerId !== userId) {
      throw new ForbiddenError('You do not own this vehicle');
    }

    return prisma.vehicleImage.create({
      data: {
        vehicleId,
        url: imageData.url,
        thumbnailUrl: imageData.thumbnailUrl || imageData.url,
        category: imageData.category || 'EXTERIOR',
        displayOrder: imageData.displayOrder || 0,
        isFeatured: imageData.isFeatured || false
      }
    });
  }
}
