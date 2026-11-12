import { Router } from 'express';
import { checkDatabaseHealth } from '../../config/database.js';
import { checkRedisHealth } from '../../config/redis.js';

const router = Router();

router.get('/', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    requestId: req.id
  });
});

router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

router.get('/ready', async (req, res) => {
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth()
  ]);

  const isHealthy = dbHealth.status === 'healthy';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'ready' : 'unhealthy',
    dependencies: {
      database: dbHealth,
      redis: redisHealth
    },
    timestamp: new Date().toISOString()
  });
});

export const healthRoutes = router;
