import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient = null;

export function getRedis() {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis retry limit reached, skipping reconnection in dev');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redisClient.on('error', (err) => {
      logger.warn({ error: err.message }, 'Redis client connection error (falling back where possible)');
    });
  }
  return redisClient;
}

export const redis = getRedis();

export async function checkRedisHealth() {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connect') {
      await redis.connect().catch(() => {});
    }
    const pong = await redis.ping();
    return { status: pong === 'PONG' ? 'healthy' : 'degraded' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
