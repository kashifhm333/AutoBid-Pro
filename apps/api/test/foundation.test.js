import { describe, it, expect } from 'vitest';
import { generateAccessToken, verifyAccessToken, generateRefreshToken, hashToken } from '../src/modules/auth/tokenService.js';
import { AppError, ValidationError, AuthenticationError, ForbiddenError } from '../src/errors/index.js';
import { ROLES, PERMISSIONS, getMinimumIncrement } from '@autobid/config';
import { registerSchema, loginSchema } from '@autobid/validation';

describe('Backend Foundation — Configuration & Business Logic', () => {
  it('should correctly compute minimum bid increments according to tiered pricing brackets', () => {
    expect(getMinimumIncrement(1500)).toBe(50);
    expect(getMinimumIncrement(5000)).toBe(100);
    expect(getMinimumIncrement(25000)).toBe(250);
    expect(getMinimumIncrement(75000)).toBe(500);
    expect(getMinimumIncrement(150000)).toBe(1000);
    expect(getMinimumIncrement(500000)).toBe(2500);
  });

  it('should define all 11 user roles and key granular permissions', () => {
    expect(Object.keys(ROLES).length).toBe(11);
    expect(ROLES.SUPER_ADMINISTRATOR).toBe('SUPER_ADMINISTRATOR');
    expect(ROLES.BUYER).toBe('BUYER');
    expect(ROLES.SELLER).toBe('SELLER');
    expect(PERMISSIONS.VEHICLES_APPROVE).toBe('vehicles.approve');
    expect(PERMISSIONS.BIDS_CREATE).toBe('bids.create');
  });
});

describe('Backend Foundation — Crypto & Token Management', () => {
  const sampleUser = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@autobidpro.com',
    roles: [ROLES.BUYER],
    permissions: [PERMISSIONS.BIDS_CREATE]
  };

  it('should sign and verify access token with correct claims', () => {
    const token = generateAccessToken(sampleUser);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(sampleUser.userId);
    expect(decoded.email).toBe(sampleUser.email);
    expect(decoded.roles).toContain(ROLES.BUYER);
    expect(decoded.permissions).toContain(PERMISSIONS.BIDS_CREATE);
  });

  it('should reject tampered access tokens', () => {
    const token = generateAccessToken(sampleUser);
    const tampered = token.slice(0, -5) + 'abcde';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('should generate opaque refresh tokens and produce deterministic hashes', () => {
    const { rawToken, tokenHash } = generateRefreshToken();
    expect(rawToken.length).toBe(80); // 40 bytes hex = 80 chars
    expect(tokenHash.length).toBe(64); // sha256 hex = 64 chars
    expect(hashToken(rawToken)).toBe(tokenHash);
  });
});

describe('Backend Foundation — Validation Schemas', () => {
  it('should reject registration with weak passwords or invalid emails', () => {
    const weakPass = registerSchema.safeParse({
      email: 'invalid-email',
      password: 'weak',
      firstName: 'John',
      lastName: 'Doe'
    });
    expect(weakPass.success).toBe(false);
  });

  it('should accept valid registration payloads', () => {
    const valid = registerSchema.safeParse({
      email: 'buyer@autobidpro.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
      role: 'BUYER'
    });
    expect(valid.success).toBe(true);
  });
});

describe('Backend Foundation — Standardized Errors', () => {
  it('should format operational error contracts accurately', () => {
    const err = new ValidationError('Invalid VIN format', [{ field: 'vin', message: 'Must be 17 chars' }]);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toHaveLength(1);
    expect(err.isOperational).toBe(true);
  });

  it('should enforce 401 for AuthenticationError and 403 for ForbiddenError', () => {
    const authErr = new AuthenticationError();
    expect(authErr.statusCode).toBe(401);
    expect(authErr.code).toBe('UNAUTHENTICATED');

    const forbErr = new ForbiddenError();
    expect(forbErr.statusCode).toBe(403);
    expect(forbErr.code).toBe('FORBIDDEN');
  });
});
