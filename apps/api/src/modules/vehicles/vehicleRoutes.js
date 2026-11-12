import { Router } from 'express';
import { VehicleController } from './vehicleController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRole } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createVehicleSchema, updateVehicleSchema } from '@autobid/validation';
import { ROLES } from '@autobid/config';

const router = Router();

// Public routes
router.get('/', VehicleController.list);
router.get('/:id', VehicleController.getById);

// Protected routes
router.post(
  '/',
  authenticate,
  requireRole(ROLES.SELLER, ROLES.DEALER, ROLES.ADMINISTRATOR),
  validate({ body: createVehicleSchema }),
  VehicleController.create
);

router.put(
  '/:id',
  authenticate,
  validate({ body: updateVehicleSchema }),
  VehicleController.update
);

router.patch(
  '/:id/status',
  authenticate,
  VehicleController.transition
);

router.post(
  '/:id/images',
  authenticate,
  VehicleController.addImage
);

export const vehicleRoutes = router;
