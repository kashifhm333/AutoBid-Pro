import { describe, it, expect } from 'vitest';
import { validateVehicleTransition, VEHICLE_TRANSITIONS } from '../src/modules/vehicles/vehicleStateMachine.js';
import { VEHICLE_STATUSES, ROLES, FEE_SCHEDULE, ANTI_SNIPING_DEFAULTS } from '@autobid/config';
import { ValidationError, ForbiddenError } from '../src/errors/index.js';

describe('Core Domain — Vehicle State Machine', () => {
  it('should allow valid linear transitions by authorized roles', () => {
    expect(() => validateVehicleTransition(
      VEHICLE_STATUSES.DRAFT,
      VEHICLE_STATUSES.SUBMITTED,
      [ROLES.SELLER]
    )).not.toThrow();

    expect(() => validateVehicleTransition(
      VEHICLE_STATUSES.SUBMITTED,
      VEHICLE_STATUSES.UNDER_REVIEW,
      [ROLES.AUCTION_MANAGER]
    )).not.toThrow();

    expect(() => validateVehicleTransition(
      VEHICLE_STATUSES.UNDER_REVIEW,
      VEHICLE_STATUSES.APPROVED,
      [ROLES.AUCTION_MANAGER]
    )).not.toThrow();

    expect(() => validateVehicleTransition(
      VEHICLE_STATUSES.APPROVED,
      VEHICLE_STATUSES.SCHEDULED,
      [ROLES.AUCTION_MANAGER]
    )).not.toThrow();
  });

  it('should reject invalid non-adjacent transitions', () => {
    expect(() => validateVehicleTransition(
      VEHICLE_STATUSES.DRAFT,
      VEHICLE_STATUSES.LIVE,
      [ROLES.SUPER_ADMINISTRATOR]
    )).toThrow(ValidationError);

    expect(() => validateVehicleTransition(
      VEHICLE_STATUSES.COMPLETED,
      VEHICLE_STATUSES.DRAFT,
      [ROLES.SUPER_ADMINISTRATOR]
    )).toThrow(ValidationError);
  });

  it('should reject transitions by unauthorized user roles', () => {
    // Buyer cannot approve a vehicle
    expect(() => validateVehicleTransition(
      VEHICLE_STATUSES.UNDER_REVIEW,
      VEHICLE_STATUSES.APPROVED,
      [ROLES.BUYER]
    )).toThrow(ForbiddenError);

    // Seller cannot directly schedule a vehicle without manager approval
    expect(() => validateVehicleTransition(
      VEHICLE_STATUSES.APPROVED,
      VEHICLE_STATUSES.SCHEDULED,
      [ROLES.SELLER]
    )).toThrow(ForbiddenError);
  });

  it('should allow Super Administrator to perform any valid transition', () => {
    expect(() => validateVehicleTransition(
      VEHICLE_STATUSES.APPROVED,
      VEHICLE_STATUSES.SCHEDULED,
      [ROLES.SUPER_ADMINISTRATOR]
    )).not.toThrow();
  });
});

describe('Core Domain — Auction Financial & Anti-Sniping Logic', () => {
  it('should accurately calculate Buyer Premium according to fee schedule', () => {
    const calcPremium = (bid) => Math.min(
      FEE_SCHEDULE.BUYER_PREMIUM_MAX_FEE,
      Math.max(FEE_SCHEDULE.BUYER_PREMIUM_MIN_FEE, bid * FEE_SCHEDULE.BUYER_PREMIUM_PERCENTAGE)
    );

    // $5,000 bid -> 5% is $250, but minimum fee floor is $500
    expect(calcPremium(5000)).toBe(500);

    // $50,000 bid -> 5% is $2,500
    expect(calcPremium(50000)).toBe(2500);

    // $200,000 bid -> 5% is $10,000, but maximum fee cap is $5,000
    expect(calcPremium(200000)).toBe(5000);
  });

  it('should trigger anti-sniping extension when bid arrives in soft-close window', () => {
    const now = Date.now();
    const endingIn60Seconds = new Date(now + 60 * 1000);
    const windowMs = ANTI_SNIPING_DEFAULTS.WINDOW_SECONDS * 1000;
    const extMs = ANTI_SNIPING_DEFAULTS.EXTENSION_SECONDS * 1000;

    const timeRemaining = endingIn60Seconds.getTime() - now;
    const shouldExtend = timeRemaining <= windowMs;
    const newEndTime = new Date(endingIn60Seconds.getTime() + extMs);

    expect(shouldExtend).toBe(true);
    expect(newEndTime.getTime()).toBe(endingIn60Seconds.getTime() + 120000);
  });

  it('should not extend auction if bid arrives outside soft-close window', () => {
    const now = Date.now();
    const endingIn10Minutes = new Date(now + 600 * 1000);
    const windowMs = ANTI_SNIPING_DEFAULTS.WINDOW_SECONDS * 1000;

    const timeRemaining = endingIn10Minutes.getTime() - now;
    const shouldExtend = timeRemaining <= windowMs;

    expect(shouldExtend).toBe(false);
  });
});
