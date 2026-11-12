import Stripe from 'stripe';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AuthenticationError, ValidationError } from '../../errors/index.js';

class PaymentGatewayAdapter {
  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2024-12-18.acacia'
    });
  }

  /**
   * Creates a PaymentIntent (supports manual pre-authorization holds for deposits)
   */
  async createPaymentIntent({ amount, currency = 'usd', captureMethod = 'automatic', metadata = {}, idempotencyKey = null }) {
    try {
      const amountInCents = Math.round(Number(amount) * 100);

      // In development/test with mock keys, simulate realistic gateway response if Stripe fails
      if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.includes('mock') || env.STRIPE_SECRET_KEY.includes('placeholder')) {
        return {
          id: `pi_mock_${crypto.randomUUID()}`,
          clientSecret: `pi_mock_secret_${crypto.randomBytes(16).toString('hex')}`,
          amount: amountInCents,
          currency,
          status: captureMethod === 'manual' ? 'requires_capture' : 'requires_payment_method',
          metadata
        };
      }

      const options = idempotencyKey ? { idempotencyKey } : {};
      const intent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        capture_method: captureMethod,
        metadata
      }, options);

      return {
        id: intent.id,
        clientSecret: intent.client_secret,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        metadata: intent.metadata
      };
    } catch (err) {
      logger.error({ error: err.message }, 'Payment gateway createPaymentIntent failed');
      throw new ValidationError(`Payment gateway error: ${err.message}`);
    }
  }

  /**
   * Captures a pre-authorized deposit hold
   */
  async capturePaymentIntent(paymentIntentId, amountToCapture = null) {
    try {
      if (paymentIntentId.startsWith('pi_mock_')) {
        return { id: paymentIntentId, status: 'succeeded' };
      }

      const params = amountToCapture ? { amount_to_capture: Math.round(Number(amountToCapture) * 100) } : {};
      return await this.stripe.paymentIntents.capture(paymentIntentId, params);
    } catch (err) {
      logger.error({ error: err.message, paymentIntentId }, 'Payment gateway capture failed');
      throw new ValidationError(`Failed to capture pre-authorized payment: ${err.message}`);
    }
  }

  /**
   * Cancels/releases a pre-authorized deposit hold
   */
  async cancelPaymentIntent(paymentIntentId) {
    try {
      if (paymentIntentId.startsWith('pi_mock_')) {
        return { id: paymentIntentId, status: 'canceled' };
      }

      return await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (err) {
      logger.error({ error: err.message, paymentIntentId }, 'Payment gateway cancel failed');
      throw new ValidationError(`Failed to release pre-authorized deposit: ${err.message}`);
    }
  }

  /**
   * Processes a refund
   */
  async createRefund({ paymentIntentId, amount, reason = 'requested_by_customer' }) {
    try {
      if (paymentIntentId.startsWith('pi_mock_')) {
        return {
          id: `re_mock_${crypto.randomUUID()}`,
          status: 'succeeded',
          amount: Math.round(Number(amount) * 100)
        };
      }

      return await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(Number(amount) * 100) : undefined,
        reason
      });
    } catch (err) {
      logger.error({ error: err.message, paymentIntentId }, 'Payment gateway refund failed');
      throw new ValidationError(`Refund error: ${err.message}`);
    }
  }

  /**
   * Cryptographically verifies incoming webhook HMAC signature
   * Prevents replay attacks and tampering
   */
  verifyWebhookSignature(rawBody, signatureHeader, secret = env.STRIPE_WEBHOOK_SECRET) {
    if (!signatureHeader) {
      throw new AuthenticationError('Missing webhook signature header');
    }

    try {
      // In development/test with mock signatures
      if (secret === 'whsec_mock_stripe_webhook_secret' && signatureHeader === 'mock_valid_signature') {
        return JSON.parse(rawBody.toString());
      }

      return this.stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
    } catch (err) {
      logger.warn({ error: err.message }, 'Webhook signature verification failed');
      throw new AuthenticationError(`Webhook signature verification failed: ${err.message}`);
    }
  }
}

export const paymentAdapter = new PaymentGatewayAdapter();
