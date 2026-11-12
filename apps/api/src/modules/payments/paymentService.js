import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { paymentAdapter } from './paymentAdapter.js';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../../errors/index.js';
import { logger } from '../../config/logger.js';
import { VEHICLE_STATUSES } from '@autobid/config';

export class PaymentService {
  /**
   * Creates a pre-authorized deposit hold required for auction participation
   */
  static async createDepositHold(userId, auctionId, amount = 500) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    if (!auction) {
      throw new NotFoundError('Auction', auctionId);
    }

    const idempotencyKey = `dep_${auctionId}_${userId}_${Date.now()}`;

    // Check existing valid deposit
    const existing = await prisma.payment.findFirst({
      where: {
        userId,
        auctionId,
        type: 'DEPOSIT',
        status: { in: ['AUTHORIZED', 'SUCCEEDED'] }
      }
    });

    if (existing) {
      return { payment: existing, alreadyAuthorized: true };
    }

    const intent = await paymentAdapter.createPaymentIntent({
      amount,
      currency: 'usd',
      captureMethod: 'manual', // Hold only, captured on settlement default
      metadata: { userId, auctionId, type: 'DEPOSIT' },
      idempotencyKey
    });

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId,
          auctionId,
          amount,
          currency: 'USD',
          type: 'DEPOSIT',
          status: 'AUTHORIZED',
          paymentProvider: 'STRIPE',
          providerPaymentId: intent.id,
          idempotencyKey,
          authorizedAt: new Date()
        }
      });

      // Register or update auction participant status
      await tx.auctionParticipant.upsert({
        where: {
          auctionId_userId: { auctionId, userId }
        },
        update: {
          depositPaid: true,
          depositPaymentId: payment.id
        },
        create: {
          auctionId,
          userId,
          depositPaid: true,
          depositPaymentId: payment.id
        }
      });

      return { payment, clientSecret: intent.clientSecret };
    });
  }

  /**
   * Creates settlement payment intent for the winning bidder
   */
  static async createWinningCheckout(userId, auctionId) {
    const winner = await prisma.auctionWinner.findUnique({
      where: { auctionId },
      include: {
        auction: {
          include: { vehicle: true }
        }
      }
    });

    if (!winner) {
      throw new NotFoundError('Winning record for auction', auctionId);
    }

    if (winner.winnerId !== userId) {
      throw new ForbiddenError('Only the winning bidder can settle payment for this auction');
    }

    if (winner.isPaid) {
      throw new ConflictError('This auction has already been fully paid and settled');
    }

    const totalAmount = Number(winner.totalAmountDue);
    const idempotencyKey = `settle_${auctionId}_${userId}`;

    const intent = await paymentAdapter.createPaymentIntent({
      amount: totalAmount,
      currency: 'usd',
      captureMethod: 'automatic',
      metadata: {
        userId,
        auctionId,
        vehicleId: winner.auction.vehicleId,
        type: 'WINNING_BID'
      },
      idempotencyKey
    });

    const payment = await prisma.payment.upsert({
      where: { idempotencyKey },
      update: {
        amount: totalAmount,
        providerPaymentId: intent.id
      },
      create: {
        userId,
        auctionId,
        amount: totalAmount,
        currency: 'USD',
        type: 'WINNING_BID',
        status: 'PENDING',
        paymentProvider: 'STRIPE',
        providerPaymentId: intent.id,
        idempotencyKey
      }
    });

    return {
      payment,
      clientSecret: intent.clientSecret,
      summary: {
        winningBid: winner.winningBidAmount,
        buyerPremium: winner.buyerPremium,
        totalDue: winner.totalAmountDue,
        deadline: winner.paymentDeadline
      }
    };
  }

  /**
   * Processes a refund
   */
  static async processRefund(paymentId, amount, reason = 'AUCTION_UNSOLD_DEPOSIT_RETURN') {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    const refundAmount = amount || payment.amount;

    const gatewayRefund = await paymentAdapter.createRefund({
      paymentIntentId: payment.providerPaymentId,
      amount: refundAmount,
      reason
    });

    return prisma.$transaction(async (tx) => {
      const refundRecord = await tx.refund.create({
        data: {
          paymentId,
          amount: refundAmount,
          reason,
          status: 'PROCESSED',
          providerRefundId: gatewayRefund.id,
          processedAt: new Date()
        }
      });

      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' }
      });

      return refundRecord;
    });
  }

  /**
   * Cryptographically verified and idempotent Stripe webhook handler
   */
  static async handleWebhook(event) {
    const eventId = event.id;
    const eventType = event.type;
    const paymentIntent = event.data?.object;

    logger.info({ eventId, eventType }, 'Processing Stripe Webhook Event');

    // Verify Idempotency: Check if transaction has already recorded this event
    const existingTx = await prisma.transaction.findFirst({
      where: {
        gatewayResponse: {
          path: ['id'],
          equals: eventId
        }
      }
    });

    if (existingTx) {
      logger.info({ eventId }, 'Duplicate webhook event received; safely ignoring (idempotent)');
      return { received: true, idempotent: true };
    }

    if (eventType === 'payment_intent.succeeded') {
      const providerPaymentId = paymentIntent.id;

      const payment = await prisma.payment.findFirst({
        where: { providerPaymentId },
        include: {
          auction: {
            include: {
              winner: true,
              vehicle: true
            }
          }
        }
      });

      if (!payment) {
        logger.warn({ providerPaymentId }, 'Payment record not found for succeeded payment_intent');
        return { received: true };
      }

      await prisma.$transaction(async (tx) => {
        // 1. Mark payment succeeded
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCEEDED',
            capturedAt: new Date()
          }
        });

        // 2. Record transaction audit
        await tx.transaction.create({
          data: {
            paymentId: payment.id,
            amount: payment.amount,
            status: 'SUCCEEDED',
            gatewayResponse: event
          }
        });

        // 3. If winning settlement, update winner and vehicle lifecycle
        if (payment.type === 'WINNING_BID' && payment.auction?.winner) {
          await tx.auctionWinner.update({
            where: { id: payment.auction.winner.id },
            data: { isPaid: true }
          });

          await tx.vehicle.update({
            where: { id: payment.auction.vehicleId },
            data: { status: VEHICLE_STATUSES.COMPLETED }
          });

          // 4. Generate Invoice
          const invoiceNum = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          await tx.invoice.create({
            data: {
              paymentId: payment.id,
              invoiceNum,
              subtotal: payment.auction.winner.winningBidAmount,
              tax: 0,
              total: payment.auction.winner.totalAmountDue
            }
          });

          logger.info({ auctionId: payment.auctionId, invoiceNum }, 'Auction settled and invoice issued successfully');
        }
      });
    } else if (eventType === 'payment_intent.payment_failed') {
      const providerPaymentId = paymentIntent.id;
      await prisma.payment.updateMany({
        where: { providerPaymentId },
        data: {
          status: 'FAILED',
          errorMessage: paymentIntent.last_payment_error?.message || 'Card payment declined'
        }
      });
    }

    return { received: true };
  }
}
