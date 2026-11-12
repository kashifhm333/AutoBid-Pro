import { Router } from 'express';
import { BiddingController } from './biddingController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { rateLimiter } from '../../middlewares/rateLimiter.js';
import { placeBidSchema, setProxyBidSchema } from '@autobid/validation';

const router = Router();

// High-throughput rate limiter for live bidding (e.g. 60 bids/minute per IP)
const biddingRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  keyPrefix: 'bid_rl'
});

router.post(
  '/',
  authenticate,
  biddingRateLimiter,
  validate({ body: placeBidSchema }),
  BiddingController.placeBid
);

router.post(
  '/proxy',
  authenticate,
  validate({ body: setProxyBidSchema }),
  BiddingController.setProxyBid
);

router.get(
  '/history/:auctionId',
  BiddingController.getHistory
);

export const biddingRoutes = router;
