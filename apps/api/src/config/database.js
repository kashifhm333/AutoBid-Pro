import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { env } from './env.js';

let prismaInstance = null;

export function getPrisma() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: env.NODE_ENV === 'development' ? [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' }
      ] : [
        { emit: 'stdout', level: 'error' }
      ]
    });

    if (env.NODE_ENV === 'development') {
      prismaInstance.$on('query', (e) => {
        logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Prisma Query');
      });
    }
  }
  return prismaInstance;
}

export const prisma = getPrisma();

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy' };
  } catch (error) {
    logger.error({ error: error.message }, 'Database health check failed');
    return { status: 'unhealthy', error: error.message };
  }
}
