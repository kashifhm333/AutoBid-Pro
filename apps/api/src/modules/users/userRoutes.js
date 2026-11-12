import { Router } from 'express';
import { UserController } from './userController.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

router.get('/profile', authenticate, UserController.getProfile);
router.put('/profile', authenticate, UserController.updateProfile);
router.patch('/preferences', authenticate, UserController.updatePreferences);
router.get('/sellers/:id', UserController.getSeller);

export const userRoutes = router;
