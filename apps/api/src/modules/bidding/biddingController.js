import { BiddingService } from './biddingService.js';
import { ProxyBiddingService } from './proxyBiddingService.js';

export class BiddingController {
  static async placeBid(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await BiddingService.placeBid({
        auctionId: req.body.auctionId,
        bidderId: req.user.id,
        amount: req.body.amount,
        ipAddress
      });

      res.status(201).json({
        success: true,
        data: result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async setProxyBid(req, res, next) {
    try {
      const proxyBid = await ProxyBiddingService.setProxyBid(
        req.body.auctionId,
        req.user.id,
        req.body.maxAmount
      );

      res.status(200).json({
        success: true,
        data: {
          id: proxyBid.id,
          auctionId: proxyBid.auctionId,
          maxAmount: proxyBid.maxAmount,
          isActive: proxyBid.isActive
        },
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const bids = await BiddingService.getAuctionBids(req.params.auctionId);
      res.status(200).json({
        success: true,
        data: bids,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }
}
