import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { getRedis } from '../config/redis.js';
import { verifyAccessToken } from '../modules/auth/tokenService.js';
import { registerAuctionSocketHandlers } from './auctionSocketHandler.js';
import { registerNotificationSocketHandlers } from './notificationSocketHandler.js';

let ioInstance = null;

export function initSocketServer(httpServer) {
  const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());

  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        callback(new Error('CORS origin not allowed for socket'));
      },
      credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ['websocket', 'polling']
  });

  // Attach Redis adapter for horizontal scaling if Redis is connected
  try {
    const pubClient = getRedis();
    if (pubClient && pubClient.status === 'ready') {
      const subClient = pubClient.duplicate();
      ioInstance.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO configured with Redis Pub/Sub adapter');
    }
  } catch (err) {
    logger.warn({ error: err.message }, 'Proceeding with default in-memory Socket.IO adapter');
  }

  // Socket Authentication Middleware
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        socket.user = {
          id: decoded.sub,
          email: decoded.email,
          roles: decoded.roles || [],
          permissions: decoded.permissions || []
        };
      } catch (err) {
        logger.debug({ error: err.message }, 'Socket token verification failed; treating as guest');
        socket.user = null;
      }
    } else {
      socket.user = null;
    }

    next();
  });

  // Connection Lifecycle
  ioInstance.on('connection', (socket) => {
    const userId = socket.user ? socket.user.id : 'guest';
    logger.debug({ socketId: socket.id, userId }, 'WebSocket client connected');

    // Register user private room for notifications & outbid alerts
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
    }

    // Register domain handlers
    registerAuctionSocketHandlers(ioInstance, socket);
    registerNotificationSocketHandlers(ioInstance, socket);

    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, 'WebSocket client disconnected');
    });
  });

  return ioInstance;
}

export function getIO() {
  if (!ioInstance) {
    logger.warn('getIO() called before Socket.IO initialization');
  }
  return ioInstance;
}
