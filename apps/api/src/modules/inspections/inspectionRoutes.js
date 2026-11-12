import { Router } from 'express';
import { InspectionController } from './inspectionController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRole } from '../../middlewares/authorize.js';
import { ROLES } from '@autobid/config';

const router = Router();

// Public view of completed condition report
router.get('/vehicle/:vehicleId', InspectionController.getByVehicle);

// Protected routes
router.post(
  '/assign',
  authenticate,
  requireRole(ROLES.AUCTION_MANAGER, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMINISTRATOR),
  InspectionController.assign
);

router.post(
  '/:id/submit',
  authenticate,
  requireRole(ROLES.INSPECTOR, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMINISTRATOR),
  InspectionController.submit
);

router.post(
  '/:id/damages',
  authenticate,
  requireRole(ROLES.INSPECTOR, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMINISTRATOR),
  InspectionController.addDamage
);

export const inspectionRoutes = router;
