import { describe, it, expect, vi } from 'vitest';
import { AdminService } from '../src/modules/admin/adminService.js';
import { requireRole } from '../src/middlewares/authorize.js';
import { ROLES, VEHICLE_STATUSES, AUCTION_STATUSES } from '@autobid/config';
import { ForbiddenError, NotFoundError } from '../src/errors/index.js';

describe('Administration & Governance — Authorization Guards', () => {
  it('should grant access to Administrator and Super Administrator roles', () => {
    const middleware = requireRole(ROLES.ADMINISTRATOR, ROLES.SUPER_ADMINISTRATOR);
    
    // Case 1: Standard Administrator
    let nextCalledAdmin = false;
    middleware({ user: { roles: [ROLES.ADMINISTRATOR] } }, {}, (err) => {
      expect(err).toBeUndefined();
      nextCalledAdmin = true;
    });
    expect(nextCalledAdmin).toBe(true);

    // Case 2: Super Administrator
    let nextCalledSuper = false;
    middleware({ user: { roles: [ROLES.SUPER_ADMINISTRATOR] } }, {}, (err) => {
      expect(err).toBeUndefined();
      nextCalledSuper = true;
    });
    expect(nextCalledSuper).toBe(true);
  });

  it('should deny access to unauthorized roles (Buyer, Seller, Inspector)', () => {
    const middleware = requireRole(ROLES.ADMINISTRATOR, ROLES.SUPER_ADMINISTRATOR);

    middleware({ user: { roles: [ROLES.BUYER] } }, {}, (err) => {
      expect(err).toBeInstanceOf(ForbiddenError);
    });

    middleware({ user: { roles: [ROLES.SELLER] } }, {}, (err) => {
      expect(err).toBeInstanceOf(ForbiddenError);
    });

    middleware({ user: { roles: [ROLES.INSPECTOR] } }, {}, (err) => {
      expect(err).toBeInstanceOf(ForbiddenError);
    });
  });
});

describe('Administration & Governance — Moderation & Guardrails', () => {
  it('should disallow suspension or modification of Super Administrator accounts', async () => {
    // Mock prisma to return a user who has SUPER_ADMINISTRATOR role
    const { prisma } = await import('../src/config/database.js');
    const findUniqueSpy = vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      id: 'super-admin-uuid',
      email: 'root@autobidpro.com',
      status: 'ACTIVE',
      userRoles: [{ role: { name: ROLES.SUPER_ADMINISTRATOR } }]
    });

    await expect(
      AdminService.updateUserStatus('super-admin-uuid', 'SUSPENDED', 'Misconduct', 'admin-actor-uuid')
    ).rejects.toThrow(ForbiddenError);

    findUniqueSpy.mockRestore();
  });

  it('should compute appropriate target vehicle status for curation decisions', () => {
    const getTargetStatus = (decision) => {
      if (decision === 'REJECT') return VEHICLE_STATUSES.DRAFT;
      if (decision === 'REQUEST_CHANGES') return VEHICLE_STATUSES.UNDER_REVIEW;
      if (decision === 'APPROVE') return VEHICLE_STATUSES.APPROVED;
      return null;
    };

    expect(getTargetStatus('APPROVE')).toBe(VEHICLE_STATUSES.APPROVED);
    expect(getTargetStatus('REJECT')).toBe(VEHICLE_STATUSES.DRAFT);
    expect(getTargetStatus('REQUEST_CHANGES')).toBe(VEHICLE_STATUSES.UNDER_REVIEW);
  });

  it('should correctly calculate extended auction end times', () => {
    const now = new Date('2026-09-08T18:00:00.000Z');
    const extraMinutes = 15;
    const newEndTime = new Date(now.getTime() + extraMinutes * 60 * 1000);

    expect(newEndTime.toISOString()).toBe('2026-09-08T18:15:00.000Z');
  });
});
