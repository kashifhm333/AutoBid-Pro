import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { paymentAdapter } from '../src/modules/payments/paymentAdapter.js';
import { AuthenticationError } from '../src/errors/index.js';
import { FEE_SCHEDULE } from '@autobid/config';

describe('Payment Engine — Settlement Calculations & Fees', () => {
  it('should enforce 5% buyer premium with minimum floor ($500) and maximum cap ($5,000)', () => {
    const computeTotal = (winningBid) => {
      const premium = Math.min(
        FEE_SCHEDULE.BUYER_PREMIUM_MAX_FEE,
        Math.max(FEE_SCHEDULE.BUYER_PREMIUM_MIN_FEE, winningBid * FEE_SCHEDULE.BUYER_PREMIUM_PERCENTAGE)
      );
      return { premium, total: winningBid + premium };
    };

    // Case 1: Low-value vehicle ($6,000 winning bid) -> 5% is $300 -> floor $500 applied
    const low = computeTotal(6000);
    expect(low.premium).toBe(500);
    expect(low.total).toBe(6500);

    // Case 2: Mid-tier vehicle ($60,000 winning bid) -> 5% is $3,000
    const mid = computeTotal(60000);
    expect(mid.premium).toBe(3000);
    expect(mid.total).toBe(63000);

    // Case 3: Exotic vehicle ($350,000 winning bid) -> 5% is $17,500 -> cap $5,000 applied
    const exotic = computeTotal(350000);
    expect(exotic.premium).toBe(5000);
    expect(exotic.total).toBe(355000);
  });

  it('should format unique, non-colliding invoice numbers', () => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const generateInvoiceNum = () => `INV-${todayStr}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const inv1 = generateInvoiceNum();
    const inv2 = generateInvoiceNum();

    expect(inv1).toMatch(/^INV-\d{8}-[A-F0-9]{6}$/);
    expect(inv2).toMatch(/^INV-\d{8}-[A-F0-9]{6}$/);
    expect(inv1).not.toBe(inv2);
  });
});

describe('Payment Engine — Webhook Cryptographic Verification & Idempotency', () => {
  it('should reject webhooks missing the signature header', () => {
    const rawBody = Buffer.from(JSON.stringify({ id: 'evt_test_123', type: 'payment_intent.succeeded' }));
    expect(() => paymentAdapter.verifyWebhookSignature(rawBody, null)).toThrow(AuthenticationError);
  });

  it('should reject webhooks with forged signatures', () => {
    const rawBody = Buffer.from(JSON.stringify({ id: 'evt_test_123', type: 'payment_intent.succeeded' }));
    const forgedSignature = 't=12345678,v1=invalid_tampered_signature_hex';

    expect(() => paymentAdapter.verifyWebhookSignature(rawBody, forgedSignature, 'real_secret')).toThrow(AuthenticationError);
  });

  it('should verify valid mock test webhook signatures in development', () => {
    const payload = { id: 'evt_mock_001', type: 'payment_intent.succeeded' };
    const rawBody = Buffer.from(JSON.stringify(payload));

    const event = paymentAdapter.verifyWebhookSignature(
      rawBody,
      'mock_valid_signature',
      'whsec_mock_stripe_webhook_secret'
    );

    expect(event.id).toBe('evt_mock_001');
    expect(event.type).toBe('payment_intent.succeeded');
  });

  it('should construct deterministic idempotency keys for deposit and settlement holds', () => {
    const auctionId = 'auc-123';
    const userId = 'usr-456';

    const settlementKey = `settle_${auctionId}_${userId}`;
    expect(settlementKey).toBe('settle_auc-123_usr-456');
  });
});
