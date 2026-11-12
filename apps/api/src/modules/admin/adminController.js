import { AdminService } from './adminService.js';

export class AdminController {
  static async getOverview(req, res, next) {
    try {
      const data = await AdminService.getPlatformOverview();
      res.status(200).json({
        success: true,
        data,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req, res, next) {
    try {
      const { page, limit, ...filters } = req.query;
      const result = await AdminService.listUsers(filters, { page, limit });
      res.status(200).json({
        success: true,
        ...result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const updated = await AdminService.updateUserStatus(
        req.params.id,
        status,
        reason,
        req.user.id
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

  static async curateVehicle(req, res, next) {
    try {
      const { decision, notes } = req.body;
      const result = await AdminService.curateVehicle(
        req.params.id,
        decision,
        notes,
        req.user.id
      );
      res.status(200).json({
        success: true,
        data: result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async manageAuction(req, res, next) {
    try {
      const { action, ...params } = req.body;
      const result = await AdminService.manageAuction(
        req.params.id,
        action,
        params,
        req.user.id
      );
      res.status(200).json({
        success: true,
        data: result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async listAuditLogs(req, res, next) {
    try {
      const { page, limit, ...filters } = req.query;
      const result = await AdminService.listAuditLogs(filters, { page, limit });
      res.status(200).json({
        success: true,
        ...result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSettings(req, res, next) {
    try {
      const settings = await AdminService.getSettings();
      res.status(200).json({
        success: true,
        data: settings,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSetting(req, res, next) {
    try {
      const { key, value } = req.body;
      const updated = await AdminService.updateSetting(key, value, req.user.id);
      res.status(200).json({
        success: true,
        data: updated,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }
}
