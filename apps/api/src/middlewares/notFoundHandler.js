import { NotFoundError } from '../errors/index.js';

export function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
}
