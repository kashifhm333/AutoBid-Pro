import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';
import { initSocketServer } from './realtime/socketServer.js';
import { initAuctionWorker, stopAuctionWorker } from './workers/auctionWorker.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Real-Time WebSocket Gateway
const io = initSocketServer(server);

// Initialize Asynchronous Background Processing
initAuctionWorker();

// Graceful shutdown handler
async function handleShutdown(signal) {
  logger.info({ signal }, 'Received shutdown signal. Commencing graceful termination...');

  stopAuctionWorker();

  server.close(async () => {
    logger.info('HTTP & WebSocket server closed. Disconnecting database and cache clients...');
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected cleanly');
    } catch (err) {
      logger.error({ error: err.message }, 'Error disconnecting database');
    }

    try {
      if (redis.status === 'ready') {
        await redis.quit();
        logger.info('Redis disconnected cleanly');
      }
    } catch (err) {
      logger.error({ error: err.message }, 'Error disconnecting Redis');
    }

    logger.info('Graceful shutdown completed. Exiting process.');
    process.exit(0);
  });

  // Force exit if termination hangs
  setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection at Promise');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error: error.message, stack: error.stack }, 'Uncaught Exception thrown');
  process.exit(1);
});

// Start listening
server.listen(env.PORT, () => {
  logger.info(`🚀 AutoBid Pro API Gateway running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`📡 Health probe available at http://localhost:${env.PORT}/health`);
  logger.info(`⚡ Socket.IO real-time engine active on ws://localhost:${env.PORT}`);
  logger.info(`🔑 API v1 routes available under ${env.API_PREFIX}`);
});
