import { logger } from '../config/logger.js';

export function requestLogger(req, res, next) {
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'HTTP Request Error');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'HTTP Request Warning');
    } else {
      logger.info(logData, 'HTTP Request Completed');
    }
  });

  next();
}
