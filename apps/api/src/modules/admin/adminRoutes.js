import { Router } from 'express';
import { AdminController } from './adminController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRole } from '../../middlewares/authorize.js';
import { ROLES } from '@autobid/config';

const router = Router();

// Protect all admin endpoints with dual-guard: Authentication + Role requirement
router.use(authenticate, requireRole(ROLES.ADMINISTRATOR, ROLES.SUPER_ADMINISTRATOR));

router.get('/overview', AdminController.getOverview);
router.get('/users', AdminController.listUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.post('/vehicles/:id/curate', AdminController.curateVehicle);
router.post('/auctions/:id/manage', AdminController.manageAuction);
router.get('/audit-logs', AdminController.listAuditLogs);
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSetting);

export const adminRoutes = router;
