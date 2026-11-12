import { RateLimitError } from '../errors/index.js';
import { redis } from '../config/redis.js';
import { env } from '../config/env.js';

// In-memory fallback map if Redis is temporarily unreachable
const memoryStore = new Map();

/**
 * Creates a sliding-window rate limiter middleware
 * @param {object} options - { windowMs, maxRequests, keyGenerator }
 */
export function rateLimiter(options = {}) {
  const windowMs = options.windowMs || env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = options.maxRequests || env.RATE_LIMIT_MAX_REQUESTS;
  const keyPrefix = options.keyPrefix || 'rl';

  return async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    try {
      if (redis.status === 'ready') {
        const multi = redis.multi();
        multi.zremrangebyscore(key, 0, now - windowMs);
        multi.zadd(key, now, `${now}-${Math.random()}`);
        multi.zcard(key);
        multi.pexpire(key, windowMs);

        const results = await multi.exec();
        const requestCount = results[2][1];

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount));

        if (requestCount > maxRequests) {
          const retryAfter = Math.ceil(windowMs / 1000);
          res.setHeader('Retry-After', retryAfter);
          return next(new RateLimitError('Too many requests. Please slow down.', retryAfter));
        }

        return next();
      }
    } catch (err) {
      // Fallback to in-memory store
    }

    // In-memory fallback
    let record = memoryStore.get(key);
    if (!record || now - record.startTime > windowMs) {
      record = { startTime: now, count: 0 };
      memoryStore.set(key, record);
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.startTime + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return next(new RateLimitError('Too many requests. Please slow down.', retryAfter));
    }

    next();
  };
}
