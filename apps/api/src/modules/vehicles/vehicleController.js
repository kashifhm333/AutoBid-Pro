import { VehicleService } from './vehicleService.js';

export class VehicleController {
  static async create(req, res, next) {
    try {
      const vehicle = await VehicleService.createVehicle(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: vehicle,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const vehicle = await VehicleService.getVehicleById(req.params.id);
      res.status(200).json({
        success: true,
        data: vehicle,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const { page, limit, ...filters } = req.query;
      const result = await VehicleService.listVehicles(filters, { page, limit });
      res.status(200).json({
        success: true,
        ...result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updated = await VehicleService.updateVehicle(
        req.params.id,
        req.user.id,
        req.user.roles,
        req.body
      );
      res.status(200).json({
        success: true,
        data: updated,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async transition(req, res, next) {
    try {
      const { status, reason } = req.body;
      const updated = await VehicleService.transitionStatus(
        req.params.id,
        status,
        req.user.id,
        req.user.roles,
        reason
      );
      res.status(200).json({
        success: true,
        data: updated,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async addImage(req, res, next) {
    try {
      const image = await VehicleService.addVehicleImage(req.params.id, req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: image,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }
}
