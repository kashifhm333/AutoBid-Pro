import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '../../errors/index.js';
import { generateAccessToken, generateRefreshToken, hashToken } from './tokenService.js';
import { logger } from '../../config/logger.js';

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Registers a new user with default role and creates empty profile
   */
  static async register({ email, password, firstName, lastName, role = 'BUYER' }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      throw new ConflictError('A user with this email address is already registered');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Find role or create if not exists
    let roleRecord = await prisma.role.findUnique({
      where: { name: role }
    });

    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: {
          name: role,
          description: `Default role for ${role.toLowerCase()}`,
          isSystem: true
        }
      });
    }

    // Execute atomic transaction for user + role + profile creation
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          status: 'ACTIVE', // Active for standard registration, email verification can be verified asynchronously
          emailVerified: true
        }
      });

      // Assign role
      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: roleRecord.id
        }
      });

      // Create profile & preferences
      const profile = await tx.userProfile.create({
        data: {
          userId: newUser.id
        }
      });

      await tx.userPreference.create({
        data: {
          profileId: profile.id
        }
      });

      // Create seller/dealer profile if applicable
      if (role === 'SELLER') {
        await tx.sellerProfile.create({
          data: { userId: newUser.id }
        });
      } else if (role === 'DEALER') {
        await tx.dealerProfile.create({
          data: {
            userId: newUser.id,
            dealershipName: `${firstName}'s Motors`,
            dealerLicenseNum: `DL-${Date.now()}`
          }
        });
      }

      return newUser;
    });

    // Generate tokens
    const { accessToken, rawRefreshToken } = await this.issueTokenPair(user.id, user.email, [role]);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [role]
      },
      accessToken,
      refreshToken: rawRefreshToken
    };
  }

  /**
   * Logs in a user, checks password and failed attempt counters
   */
  static async login({ email, password, ipAddress = null, userAgent = null }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        userPermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    // Check account lockout
    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.lockedUntil - Date.now()) / (60 * 1000));
      throw new AuthenticationError(`Account is temporarily locked due to excessive failed attempts. Try again in ${minutesRemaining} minutes.`, 'ACCOUNT_LOCKED');
    }

    const isValidPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

    // Record login attempt
    await prisma.loginAttempt.create({
      data: {
        userId: user?.id,
        email: normalizedEmail,
        successful: isValidPassword,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent,
        failureReason: isValidPassword ? null : 'INVALID_CREDENTIALS'
      }
    });

    if (!user || !isValidPassword) {
      if (user) {
        const attempts = user.failedLoginAttempts + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil: lockUntil
          }
        });
      }
      throw new AuthenticationError('Invalid email or password');
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new AuthenticationError(`Your account has been ${user.status.toLowerCase()}. Please contact support.`, 'ACCOUNT_RESTRICTED');
    }

    // Reset failed login attempts and update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    // Extract roles and permissions
    const roles = user.userRoles.map(ur => ur.role.name);
    const rolePermissions = user.userRoles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.code));
    const directPermissions = user.userPermissions.filter(up => up.granted).map(up => up.permission.code);
    const allPermissions = Array.from(new Set([...rolePermissions, ...directPermissions]));

    const { accessToken, rawRefreshToken } = await this.issueTokenPair(
      user.id,
      user.email,
      roles,
      allPermissions,
      ipAddress,
      userAgent
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions: allPermissions
      },
      accessToken,
      refreshToken: rawRefreshToken
    };
  }

  /**
   * Refreshes access token and rotates the refresh token
   */
  static async refreshTokens({ rawRefreshToken, ipAddress = null, userAgent = null }) {
    if (!rawRefreshToken) {
      throw new AuthenticationError('Refresh token required');
    }

    const tokenHash = hashToken(rawRefreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!storedToken) {
      throw new AuthenticationError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Check reuse detection: if token is already revoked, revoke whole token family (compromise indicator)
    if (storedToken.isRevoked) {
      logger.warn({ userId: storedToken.userId, familyId: storedToken.familyId }, 'Refresh token reuse detected. Revoking token family.');
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { isRevoked: true }
      });
      throw new AuthenticationError('Invalid session. Please login again.', 'TOKEN_COMPROMISED');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token has expired. Please login again.', 'REFRESH_TOKEN_EXPIRED');
    }

    // Rotate refresh token
    const newRefresh = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true, replacedBy: newRefresh.tokenHash }
      }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: newRefresh.tokenHash,
          familyId: storedToken.familyId,
          expiresAt,
          ipAddress,
          userAgent
        }
      })
    ]);

    const roles = storedToken.user.userRoles.map(ur => ur.role.name);
    const permissions = storedToken.user.userRoles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.code));

    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      roles,
      permissions
    });

    return {
      accessToken,
      refreshToken: newRefresh.rawToken
    };
  }

  /**
   * Logs out user by revoking the refresh token
   */
  static async logout({ rawRefreshToken }) {
    if (!rawRefreshToken) return;

    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true }
    });
  }

  /**
   * Helper to issue access & refresh token pair and record session
   */
  static async issueTokenPair(userId, email, roles = [], permissions = [], ipAddress = null, userAgent = null) {
    const accessToken = generateAccessToken({ userId, email, roles, permissions });
    const { rawToken, tokenHash } = generateRefreshToken();
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        expiresAt,
        ipAddress,
        userAgent
      }
    });

    return {
      accessToken,
      rawRefreshToken: rawToken
    };
  }
}
