import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env.js';

/**
 * Generates short-lived Access Token (JWT)
 * @param {object} payload - { userId, email, roles, permissions }
 */
export function generateAccessToken(payload) {
  return jwt.sign(
    {
      sub: payload.userId,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || []
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRATION,
      issuer: 'autobid-pro',
      audience: 'autobid-client'
    }
  );
}

/**
 * Verifies and decodes an Access Token
 * @param {string} token 
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'autobid-pro',
    audience: 'autobid-client'
  });
}

/**
 * Generates an opaque, cryptographically secure Refresh Token
 */
export function generateRefreshToken() {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * One-way SHA-256 hash for secure token storage
 * @param {string} token 
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
