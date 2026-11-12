import { InspectionService } from './inspectionService.js';

export class InspectionController {
  static async assign(req, res, next) {
    try {
      const { vehicleId, inspectorId } = req.body;
      const inspection = await InspectionService.assignInspector(vehicleId, inspectorId);
      res.status(201).json({
        success: true,
        data: inspection,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async submit(req, res, next) {
    try {
      const inspection = await InspectionService.submitInspection(req.params.id, req.user.id, req.body);
      res.status(200).json({
        success: true,
        data: inspection,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async addDamage(req, res, next) {
    try {
      const damage = await InspectionService.addDamageMarker(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: damage,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByVehicle(req, res, next) {
    try {
      const inspection = await InspectionService.getInspectionByVehicle(req.params.vehicleId);
      res.status(200).json({
        success: true,
        data: inspection,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }
}
