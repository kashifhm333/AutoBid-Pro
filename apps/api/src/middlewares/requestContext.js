import crypto from 'crypto';

export function requestContext(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', requestId);
  next();
}
