import { ForbiddenError, AuthenticationError } from '../errors/index.js';
import { ROLES } from '@autobid/config';

/**
 * Checks if authenticated user has at least one of the specified roles
 * @param  {...string} allowedRoles 
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('User is not authenticated'));
    }

    const userRoles = req.user.roles || [];

    // Super Administrator bypasses standard role checks
    if (userRoles.includes(ROLES.SUPER_ADMINISTRATOR)) {
      return next();
    }

    const hasRole = allowedRoles.some(role => userRoles.includes(role));
    if (!hasRole) {
      return next(new ForbiddenError(`Required role: [${allowedRoles.join(', ')}]`));
    }

    next();
  };
}

/**
 * Checks if authenticated user has at least one of the specified granular permissions
 * @param  {...string} requiredPermissions 
 */
export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('User is not authenticated'));
    }

    const userPermissions = req.user.permissions || [];
    const userRoles = req.user.roles || [];

    // Super Administrator has all permissions
    if (userRoles.includes(ROLES.SUPER_ADMINISTRATOR)) {
      return next();
    }

    const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));
    if (!hasPermission) {
      return next(new ForbiddenError(`Required permission: [${requiredPermissions.join(', ')}]`));
    }

    next();
  };
}
