import { PaymentService } from './paymentService.js';
import { paymentAdapter } from './paymentAdapter.js';

export class PaymentController {
  static async createDeposit(req, res, next) {
    try {
      const { auctionId, amount } = req.body;
      const result = await PaymentService.createDepositHold(req.user.id, auctionId, amount);
      res.status(201).json({
        success: true,
        data: result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCheckout(req, res, next) {
    try {
      const result = await PaymentService.createWinningCheckout(req.user.id, req.params.auctionId);
      res.status(200).json({
        success: true,
        data: result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async refund(req, res, next) {
    try {
      const { paymentId, amount, reason } = req.body;
      const refund = await PaymentService.processRefund(paymentId, amount, reason);
      res.status(200).json({
        success: true,
        data: refund,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  static async handleStripeWebhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'];
      const rawBody = req.body;

      const event = paymentAdapter.verifyWebhookSignature(rawBody, signature);
      const result = await PaymentService.handleWebhook(event);

      res.status(200).json({ received: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
