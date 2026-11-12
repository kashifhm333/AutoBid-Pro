import { AppError } from '../errors/index.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const requestId = req.id || 'unknown';

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal server error occurred';
  let details = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    // Malformed JSON body
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'Invalid JSON in request payload';
  } else if (err.code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 409;
    code = 'UNIQUE_CONSTRAINT_VIOLATION';
    message = `A record with this ${err.meta?.target ? err.meta.target.join(', ') : 'field'} already exists`;
  } else if (err.code === 'P2025') {
    // Prisma record not found
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Requested record not found';
  }

  // Log 5xx errors with full stack trace
  if (statusCode >= 500) {
    logger.error({
      requestId,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    }, 'Unhandled Server Exception');
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      requestId
    }
  });
}
