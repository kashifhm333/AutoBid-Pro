import express, { Router } from 'express';
import { PaymentController } from './paymentController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRole } from '../../middlewares/authorize.js';
import { ROLES } from '@autobid/config';

const router = Router();

// 1. Stripe Webhook Endpoint (Requires raw buffer for HMAC verification)
router.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  PaymentController.handleStripeWebhook
);

// 2. Protected Payment Endpoints
router.post(
  '/deposit',
  authenticate,
  PaymentController.createDeposit
);

router.post(
  '/checkout/:auctionId',
  authenticate,
  PaymentController.createCheckout
);

router.post(
  '/refund',
  authenticate,
  requireRole(ROLES.FINANCE_MANAGER, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMINISTRATOR),
  PaymentController.refund
);

export const paymentRoutes = router;
