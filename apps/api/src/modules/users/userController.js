import { UserService } from './userService.js';

export class UserController {
  static async getProfile(req, res, next) {
    try {
      const user = await UserService.getUserProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const updated = await UserService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req, res, next) {
    try {
      const updated = await UserService.updatePreferences(req.user.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSeller(req, res, next) {
    try {
      const seller = await UserService.getSellerProfile(req.params.id);
      res.status(200).json({
        success: true,
        data: seller,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }
}
