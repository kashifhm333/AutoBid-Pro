import { AuthenticationError } from '../errors/index.js';
import { verifyAccessToken } from '../modules/auth/tokenService.js';
import { prisma } from '../config/database.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      // 2. Fallback to httpOnly cookie
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AuthenticationError('Authentication required. No token provided.');
    }

    // 3. Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Access token expired', 'TOKEN_EXPIRED');
      }
      throw new AuthenticationError('Invalid access token', 'INVALID_TOKEN');
    }

    // 4. Attach decoded claims
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || []
    };

    next();
  } catch (error) {
    next(error);
  }
}
