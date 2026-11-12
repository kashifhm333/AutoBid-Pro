import { AuctionService } from './auctionService.js';

export class AuctionController {
  static async create(req, res, next) {
    try {
      const auction = await AuctionService.createAuction(req.user.id, req.user.roles, req.body);
      res.status(201).json({
        success: true,
        data: auction,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const auction = await AuctionService.getAuctionById(req.params.id);
      res.status(200).json({
        success: true,
        data: auction,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const { page, limit, ...filters } = req.query;
      const result = await AuctionService.listAuctions(filters, { page, limit });
      res.status(200).json({
        success: true,
        ...result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async close(req, res, next) {
    try {
      const auction = await AuctionService.closeAuction(req.params.id, 'ADMIN_MANUAL_CLOSE');
      res.status(200).json({
        success: true,
        data: auction,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }
}
