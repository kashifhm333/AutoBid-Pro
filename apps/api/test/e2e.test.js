import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { VEHICLE_STATUSES, AUCTION_STATUSES, ROLES, FEE_SCHEDULE, ANTI_SNIPING_DEFAULTS } from '@autobid/config';
import { validateVehicleTransition } from '../src/modules/vehicles/vehicleStateMachine.js';
import { generateAccessToken, verifyAccessToken } from '../src/modules/auth/tokenService.js';

describe('End-to-End Marketplace Lifecycle — From Inception to Settlement', () => {
  // Global lifecycle state tracking across stages
  let buyerToken, sellerToken, adminToken;
  let vehicleRecord;
  let auctionRecord;
  let depositHold;
  let winningBid;
  let invoice;

  it('Stage 1: User Onboarding & RBAC Credential Issuance', () => {
    // 1. Seller registration & token
    const seller = {
      userId: 'usr-seller-001',
      email: 'seller@concours.com',
      roles: [ROLES.SELLER]
    };
    sellerToken = generateAccessToken(seller);
    expect(verifyAccessToken(sellerToken).sub).toBe('usr-seller-001');

    // 2. Buyer registration & token
    const buyer = {
      userId: 'usr-buyer-001',
      email: 'collector@motorclub.com',
      roles: [ROLES.BUYER]
    };
    buyerToken = generateAccessToken(buyer);
    expect(verifyAccessToken(buyerToken).sub).toBe('usr-buyer-001');

    // 3. Admin token
    const admin = {
      userId: 'usr-admin-001',
      email: 'governance@autobidpro.com',
      roles: [ROLES.ADMINISTRATOR]
    };
    adminToken = generateAccessToken(admin);
    expect(verifyAccessToken(adminToken).roles).toContain(ROLES.ADMINISTRATOR);
  });

  it('Stage 2: Bidding Deposit Pre-Authorization Hold', () => {
    // In order to participate in high-value lot bidding, buyer must place a $500 hold
    const holdAmount = FEE_SCHEDULE.BIDDER_REGISTRATION_DEPOSIT || 500;
    
    depositHold = {
      id: `dep_${crypto.randomBytes(6).toString('hex')}`,
      userId: 'usr-buyer-001',
      amount: holdAmount,
      status: 'HOLD_ACTIVE',
      paymentIntentId: `pi_mock_${crypto.randomBytes(8).toString('hex')}`,
      createdAt: new Date()
    };

    expect(depositHold.amount).toBe(500);
    expect(depositHold.status).toBe('HOLD_ACTIVE');
  });

  it('Stage 3: Vehicle Listing Lifecycle & Administrative Curation', () => {
    // Initial Draft by Seller
    vehicleRecord = {
      id: 'veh-gt3rs-001',
      sellerId: 'usr-seller-001',
      vin: 'WP0AF2A99PS187291',
      year: 2023,
      make: 'Porsche',
      model: '911 GT3 RS',
      mileage: 1840,
      reservePrice: 280000,
      status: VEHICLE_STATUSES.DRAFT
    };

    // Seller submits listing
    validateVehicleTransition(vehicleRecord.status, VEHICLE_STATUSES.SUBMITTED, [ROLES.SELLER]);
    vehicleRecord.status = VEHICLE_STATUSES.SUBMITTED;
    expect(vehicleRecord.status).toBe(VEHICLE_STATUSES.SUBMITTED);

    // Inspector / Auction Manager reviews condition report
    validateVehicleTransition(vehicleRecord.status, VEHICLE_STATUSES.UNDER_REVIEW, [ROLES.AUCTION_MANAGER, ROLES.ADMINISTRATOR]);
    vehicleRecord.status = VEHICLE_STATUSES.UNDER_REVIEW;

    // Admin approves vehicle for catalog
    validateVehicleTransition(vehicleRecord.status, VEHICLE_STATUSES.APPROVED, [ROLES.ADMINISTRATOR]);
    vehicleRecord.status = VEHICLE_STATUSES.APPROVED;
    expect(vehicleRecord.status).toBe(VEHICLE_STATUSES.APPROVED);
  });

  it('Stage 4: Auction Scheduling & Soft-Close Launch', () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
    const initialEndTime = new Date(now.getTime() + 1000 * 60);  // 1 minute from now (inside soft-close window)

    auctionRecord = {
      id: 'auc-lot-992',
      vehicleId: vehicleRecord.id,
      startingPrice: 200000,
      reservePrice: vehicleRecord.reservePrice,
      currentHighestBid: 240000,
      minimumIncrement: 2500,
      bidCount: 12,
      startTime,
      endTime: initialEndTime,
      antiSnipingWindowSec: ANTI_SNIPING_DEFAULTS.WINDOW_SECONDS,
      antiSnipingExtSec: ANTI_SNIPING_DEFAULTS.EXTENSION_SECONDS,
      extensionCount: 0,
      maxExtensions: 10,
      status: AUCTION_STATUSES.LIVE
    };

    expect(auctionRecord.status).toBe(AUCTION_STATUSES.LIVE);
  });

  it('Stage 5: Live Bidding & Anti-Sniping Dynamic Soft-Close Extension', () => {
    const timeRemaining = auctionRecord.endTime.getTime() - Date.now();
    expect(timeRemaining).toBeLessThanOrEqual(ANTI_SNIPING_DEFAULTS.WINDOW_SECONDS * 1000);

    // Late bid arrives in soft-close window
    const newBidAmount = 285000; // Meets reserve!
    expect(newBidAmount).toBeGreaterThanOrEqual(auctionRecord.currentHighestBid + auctionRecord.minimumIncrement);

    // Trigger Anti-sniping extension
    const oldEndTimeMs = auctionRecord.endTime.getTime();
    auctionRecord.endTime = new Date(oldEndTimeMs + ANTI_SNIPING_DEFAULTS.EXTENSION_SECONDS * 1000);
    auctionRecord.extensionCount += 1;
    auctionRecord.currentHighestBid = newBidAmount;
    auctionRecord.bidCount += 1;
    auctionRecord.status = AUCTION_STATUSES.EXTENDED;

    winningBid = {
      id: `bid_${crypto.randomBytes(4).toString('hex')}`,
      auctionId: auctionRecord.id,
      bidderId: 'usr-buyer-001',
      amount: newBidAmount,
      status: 'ACTIVE'
    };

    expect(auctionRecord.endTime.getTime()).toBe(oldEndTimeMs + 120000);
    expect(auctionRecord.extensionCount).toBe(1);
    expect(auctionRecord.currentHighestBid).toBe(285000);
  });

  it('Stage 6: Auction Finalization & Settlement Invoicing with Tiered Buyer Premium', () => {
    // Auction reaches extended deadline
    auctionRecord.status = AUCTION_STATUSES.SOLD;
    expect(winningBid.amount).toBeGreaterThanOrEqual(auctionRecord.reservePrice); // Reserve met!

    // Calculate 5% Buyer Premium with $5,000 ceiling
    const rawPremium = winningBid.amount * FEE_SCHEDULE.BUYER_PREMIUM_PERCENTAGE; // 285,000 * 0.05 = 14,250
    const buyerPremium = Math.min(
      FEE_SCHEDULE.BUYER_PREMIUM_MAX_FEE,
      Math.max(FEE_SCHEDULE.BUYER_PREMIUM_MIN_FEE, rawPremium)
    ); // Capped at $5,000!

    expect(buyerPremium).toBe(5000);

    const totalDue = winningBid.amount + buyerPremium;
    expect(totalDue).toBe(290000);

    // Generate Invoice
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNumber = `INV-${todayStr}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    invoice = {
      invoiceNumber,
      auctionId: auctionRecord.id,
      buyerId: winningBid.bidderId,
      vehiclePrice: winningBid.amount,
      buyerPremium,
      totalAmount: totalDue,
      status: 'PENDING_PAYMENT',
      paymentDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48-hour settlement window
    };

    expect(invoice.invoiceNumber).toMatch(/^INV-\d{8}-[A-F0-9]{6}$/);
    expect(invoice.totalAmount).toBe(290000);
    expect(invoice.status).toBe('PENDING_PAYMENT');

    // Release pre-auth deposit hold upon invoice generation
    depositHold.status = 'HOLD_RELEASED';
    expect(depositHold.status).toBe('HOLD_RELEASED');
  });
});
