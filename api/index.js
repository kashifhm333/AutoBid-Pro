import { createApp } from '../apps/api/src/app.js';

let appInstance = null;

export default function handler(req, res) {
  if (!appInstance) {
    appInstance = createApp();
  }

  // Preserve original requested path if forwarded by reverse proxy or rewrite
  const originalUrl = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || req.url;
  if (originalUrl && (originalUrl.startsWith('/api') || originalUrl.startsWith('/health')) && req.url !== originalUrl) {
    req.url = originalUrl;
  }

  return appInstance(req, res);
}
