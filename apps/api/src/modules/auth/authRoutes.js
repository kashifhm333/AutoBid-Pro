import { Router } from 'express';
import { AuthController } from './authController.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { rateLimiter } from '../../middlewares/rateLimiter.js';
import { registerSchema, loginSchema } from '@autobid/validation';

const router = Router();

// Tighter rate limiter on sensitive authentication endpoints
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  keyPrefix: 'auth_rl'
});

router.post('/register', authLimiter, validate({ body: registerSchema }), AuthController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), AuthController.login);
router.post('/refresh-token', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getCurrentUser);

export const authRoutes = router;
