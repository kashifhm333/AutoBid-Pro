import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

export class InspectionService {
  /**
   * Assigns an inspector to a vehicle
   */
  static async assignInspector(vehicleId, inspectorId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle', vehicleId);
    }

    return prisma.vehicleInspection.create({
      data: {
        vehicleId,
        inspectorId,
        status: 'ASSIGNED'
      }
    });
  }

  /**
   * Submits a completed inspection report
   */
  static async submitInspection(inspectionId, inspectorId, data) {
    const inspection = await prisma.vehicleInspection.findUnique({
      where: { id: inspectionId }
    });

    if (!inspection) {
      throw new NotFoundError('Inspection', inspectionId);
    }

    if (inspection.inspectorId && inspection.inspectorId !== inspectorId) {
      throw new ForbiddenError('You are not assigned to this inspection');
    }

    return prisma.vehicleInspection.update({
      where: { id: inspectionId },
      data: {
        status: 'SUBMITTED',
        overallScore: data.overallScore,
        odometerVerified: data.odometerVerified ?? true,
        verifiedMileage: data.verifiedMileage,
        paintMeterTest: data.paintMeterTest || null,
        obd2ScanReport: data.obd2ScanReport || null,
        summaryNotes: data.summaryNotes,
        checklistData: data.checklistData || null,
        completedAt: new Date()
      },
      include: {
        damages: true
      }
    });
  }

  /**
   * Records a visual damage marker on the vehicle schematic
   */
  static async addDamageMarker(inspectionId, damageData) {
    const inspection = await prisma.vehicleInspection.findUnique({
      where: { id: inspectionId }
    });

    if (!inspection) {
      throw new NotFoundError('Inspection', inspectionId);
    }

    return prisma.vehicleDamage.create({
      data: {
        inspectionId,
        location: damageData.location,
        damageType: damageData.damageType,
        severity: damageData.severity || 'MINOR',
        xCoord: damageData.xCoord,
        yCoord: damageData.yCoord,
        photoUrl: damageData.photoUrl || null,
        notes: damageData.notes || null
      }
    });
  }

  /**
   * Retrieves inspection details including damage markers
   */
  static async getInspectionByVehicle(vehicleId) {
    return prisma.vehicleInspection.findFirst({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      include: {
        damages: true,
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }
}
