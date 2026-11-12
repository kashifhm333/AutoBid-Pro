import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { requestContext } from './middlewares/requestContext.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

import { healthRoutes } from './modules/health/healthRoutes.js';
import { authRoutes } from './modules/auth/authRoutes.js';
import { userRoutes } from './modules/users/userRoutes.js';
import { vehicleRoutes } from './modules/vehicles/vehicleRoutes.js';
import { auctionRoutes } from './modules/auctions/auctionRoutes.js';
import { biddingRoutes } from './modules/bidding/biddingRoutes.js';
import { inspectionRoutes } from './modules/inspections/inspectionRoutes.js';
import { paymentRoutes } from './modules/payments/paymentRoutes.js';
import { adminRoutes } from './modules/admin/adminRoutes.js';

export function createApp() {
  const app = express();

  // Trust proxy for rate limiting and IP capture behind reverse proxy/load balancer
  app.set('trust proxy', 1);

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS Configuration
  const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error('CORS not allowed for this origin'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'stripe-signature']
  }));

  // Note: Webhook endpoint uses raw body, so we preserve req.body where needed
  app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      if (req.originalUrl?.includes('/webhooks/stripe')) {
        req.rawBody = buf;
      }
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Request correlation & logging
  app.use(requestContext);
  app.use(requestLogger);

  // Global Rate Limiting
  app.use(rateLimiter());

  // Observability & Root API Endpoints
  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'AutoBid Pro API Gateway',
      status: 'online',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api', (req, res) => {
    res.status(200).json({
      name: 'AutoBid Pro API Gateway',
      status: 'online',
      version: '1.0.0',
      apiPrefix: env.API_PREFIX,
      timestamp: new Date().toISOString()
    });
  });

  app.use('/health', healthRoutes);

  // Versioned API Routes (Modular Monolith)
  const apiV1 = express.Router();
  apiV1.use('/auth', authRoutes);
  apiV1.use('/users', userRoutes);
  apiV1.use('/vehicles', vehicleRoutes);
  apiV1.use('/auctions', auctionRoutes);
  apiV1.use('/bids', biddingRoutes);
  apiV1.use('/inspections', inspectionRoutes);
  apiV1.use('/payments', paymentRoutes);
  apiV1.use('/admin', adminRoutes);

  app.use(env.API_PREFIX, apiV1);

  // Catch-all 404 & centralized error handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
