import { Router } from 'express';
import { AuctionController } from './auctionController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRole } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createAuctionSchema } from '@autobid/validation';
import { ROLES } from '@autobid/config';

const router = Router();

// Public catalog routes
router.get('/', AuctionController.list);
router.get('/:id', AuctionController.getById);

// Protected routes
router.post(
  '/',
  authenticate,
  validate({ body: createAuctionSchema }),
  AuctionController.create
);

router.post(
  '/:id/close',
  authenticate,
  requireRole(ROLES.AUCTION_MANAGER, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMINISTRATOR),
  AuctionController.close
);

export const auctionRoutes = router;
