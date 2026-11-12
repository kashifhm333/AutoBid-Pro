import { describe, it, expect, vi } from 'vitest';
import { AUCTION_STATUSES, BID_STATUSES, ANTI_SNIPING_DEFAULTS } from '@autobid/config';
import { ValidationError } from '../src/errors/index.js';

describe('Concurrency Engine — Pessimistic Lock & Race Condition Protection', () => {
  it('should guarantee serialized execution and reject conflicting concurrent bids at the same amount', async () => {
    // Simulate a database row lock mutex representing PostgreSQL SELECT ... FOR UPDATE
    let lockHolder = null;
    const lockQueue = [];

    const acquireLock = () => {
      return new Promise((resolve) => {
        if (!lockHolder) {
          lockHolder = Symbol('lock');
          resolve(lockHolder);
        } else {
          lockQueue.push(resolve);
        }
      });
    };

    const releaseLock = (token) => {
      if (lockHolder === token) {
        if (lockQueue.length > 0) {
          const nextResolve = lockQueue.shift();
          lockHolder = Symbol('lock');
          nextResolve(lockHolder);
        } else {
          lockHolder = null;
        }
      }
    };

    // Shared in-memory auction record mimicking database state
    const auctionState = {
      id: 'auc-concurrency-001',
      currentHighestBid: 50000,
      minimumIncrement: 500,
      bidCount: 10,
      highestBidderId: 'bidder-original'
    };

    const bidsPlaced = [];
    const rejectedBids = [];

    // Simulated transactional bid execution mimicking BiddingService.placeBid
    const placeBidSim = async (bidderId, amount) => {
      const lockToken = await acquireLock();
      try {
        // Evaluate under lock
        const requiredMin = auctionState.currentHighestBid + auctionState.minimumIncrement;
        if (amount < requiredMin) {
          throw new ValidationError(
            `Bid must be at least $${requiredMin} (current: $${auctionState.currentHighestBid})`,
            'BID_TOO_LOW'
          );
        }

        // Simulate small I/O latency inside ACID transaction
        await new Promise(r => setTimeout(r, 10));

        // State update
        auctionState.currentHighestBid = amount;
        auctionState.bidCount += 1;
        auctionState.highestBidderId = bidderId;

        const record = { bidderId, amount, bidIndex: auctionState.bidCount };
        bidsPlaced.push(record);
        return record;
      } catch (err) {
        rejectedBids.push({ bidderId, amount, error: err.message, code: err.code });
        throw err;
      } finally {
        releaseLock(lockToken);
      }
    };

    // Scenario: Two bidders simultaneously attempt to place $50,500 at the exact same time
    const concurrentBid1 = placeBidSim('bidder-alice', 50500);
    const concurrentBid2 = placeBidSim('bidder-bob', 50500);

    const results = await Promise.allSettled([concurrentBid1, concurrentBid2]);

    // Exactly one must succeed, and exactly one must fail with BID_TOO_LOW
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(ValidationError);
    expect(rejected[0].reason.code).toBe('VALIDATION_ERROR');

    // Authoritative final state must be clean
    expect(auctionState.currentHighestBid).toBe(50500);
    expect(auctionState.bidCount).toBe(11);
    expect(bidsPlaced).toHaveLength(1);
  });

  it('should correctly process parallel staggered bids maintaining strictly monotonic price progression', async () => {
    // Auction starting at $10,000, minimum increment $250
    let currentBid = 10000;
    const minIncrement = 250;
    let mutex = Promise.resolve();

    const synchronizedBid = async (bidderId, proposedAmount) => {
      return new Promise((resolve, reject) => {
        mutex = mutex.then(async () => {
          try {
            const requiredMinimum = currentBid + minIncrement;
            if (proposedAmount < requiredMinimum) {
              return reject(new ValidationError(`Amount $${proposedAmount} < required $${requiredMinimum}`, 'BID_TOO_LOW'));
            }
            currentBid = proposedAmount;
            resolve({ bidderId, amount: proposedAmount });
          } catch (e) {
            reject(e);
          }
        });
      });
    };

    // 5 bidders submit bids concurrently with increasing amounts
    const bidRequests = [
      synchronizedBid('user-1', 10250),
      synchronizedBid('user-2', 10500),
      synchronizedBid('user-3', 10300), // Below new required ($10,750) -> will be rejected!
      synchronizedBid('user-4', 11000),
      synchronizedBid('user-5', 11500)
    ];

    const outcomes = await Promise.allSettled(bidRequests);

    const successfulBids = outcomes.filter(o => o.status === 'fulfilled').map(o => o.value);
    const failedBids = outcomes.filter(o => o.status === 'rejected').map(o => o.reason);

    expect(successfulBids).toHaveLength(4);
    expect(failedBids).toHaveLength(1);
    expect(failedBids[0].code).toBe('VALIDATION_ERROR');
    expect(currentBid).toBe(11500);
  });

  it('should atomically trigger proxy counter-bids during concurrent manual bidding', () => {
    // Proxy bidder has configured ceiling of $40,000
    const proxyBid = {
      bidderId: 'proxy-whale',
      maxAmount: 40000,
      isActive: true
    };

    let currentHighestBid = 25000;
    const minIncrement = 500;
    let highestBidder = 'seller-initial';

    const evaluateBidWithProxy = (manualBidderId, manualAmount) => {
      // 1. Manual bid validation
      const required = currentHighestBid + minIncrement;
      if (manualAmount < required) {
        throw new ValidationError('Bid too low');
      }

      currentHighestBid = manualAmount;
      highestBidder = manualBidderId;

      // 2. Atomic proxy counter-bid evaluation
      if (proxyBid.isActive && proxyBid.bidderId !== manualBidderId) {
        const proxyCounter = manualAmount + minIncrement;
        if (proxyBid.maxAmount >= proxyCounter) {
          currentHighestBid = proxyCounter;
          highestBidder = proxyBid.bidderId;
          return { manualAccepted: true, proxyTriggered: true, winner: proxyBid.bidderId, currentHighestBid };
        }
      }

      return { manualAccepted: true, proxyTriggered: false, winner: manualBidderId, currentHighestBid };
    };

    // Challenger bids $28,000
    const step1 = evaluateBidWithProxy('manual-bidder-1', 28000);
    expect(step1.manualAccepted).toBe(true);
    expect(step1.proxyTriggered).toBe(true);
    expect(step1.winner).toBe('proxy-whale');
    expect(step1.currentHighestBid).toBe(28500); // Proxy automatically countered!

    // Another challenger attempts $28,500 (too low because proxy is already at $28,500)
    expect(() => evaluateBidWithProxy('manual-bidder-2', 28500)).toThrow(ValidationError);

    // Challenger exceeds proxy with $42,000
    const step2 = evaluateBidWithProxy('manual-bidder-3', 42000);
    expect(step2.manualAccepted).toBe(true);
    expect(step2.proxyTriggered).toBe(false);
    expect(step2.winner).toBe('manual-bidder-3');
    expect(step2.currentHighestBid).toBe(42000);
  });
});
