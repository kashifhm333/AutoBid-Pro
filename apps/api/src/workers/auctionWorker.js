import { Worker, Queue } from 'bullmq';
import { prisma } from '../config/database.js';
import { AuctionService } from '../modules/auctions/auctionService.js';
import { getIO } from '../realtime/socketServer.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AUCTION_STATUSES } from '@autobid/config';

const QUEUE_NAME = 'auction-events';
let auctionQueue = null;
let auctionWorker = null;
let sweepIntervalId = null;

/**
 * Initializes BullMQ queue and worker
 */
export function initAuctionWorker() {
  try {
    const connection = {
      url: env.REDIS_URL
    };

    auctionQueue = new Queue(QUEUE_NAME, { connection });

    auctionWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { auctionId, reason } = job.data;
        logger.info({ auctionId, reason }, 'Processing auction expiration job');

        const closedAuction = await AuctionService.closeAuction(auctionId, reason);

        // Broadcast to real-time room
        const io = getIO();
        if (io) {
          io.to(`auction:${auctionId}`).emit('auction:closed', {
            auctionId,
            status: closedAuction.status,
            reserveMet: closedAuction.reserveMet,
            finalBid: closedAuction.currentHighestBid
          });
        }

        return { success: true, auctionId, status: closedAuction.status };
      },
      { connection, concurrency: 5 }
    );

    auctionWorker.on('completed', (job) => {
      logger.info({ jobId: job.id, result: job.returnvalue }, 'Auction close job completed successfully');
    });

    auctionWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, error: err.message }, 'Auction close job failed');
    });

  } catch (err) {
    logger.warn({ error: err.message }, 'BullMQ worker queue init failed (falling back to in-memory sweeper)');
  }

  // Authoritative Sweeper Interval: Checks every 10 seconds for expired auctions
  startAuctionSweeper();
}

/**
 * Sweeper routine identifying expired LIVE auctions
 */
function startAuctionSweeper() {
  if (sweepIntervalId) clearInterval(sweepIntervalId);

  sweepIntervalId = setInterval(async () => {
    try {
      const now = new Date();
      const expiredAuctions = await prisma.auction.findMany({
        where: {
          status: { in: [AUCTION_STATUSES.LIVE, AUCTION_STATUSES.EXTENDED] },
          endTime: { lte: now }
        },
        select: { id: true }
      });

      for (const { id } of expiredAuctions) {
        if (auctionQueue) {
          await auctionQueue.add('close-auction', {
            auctionId: id,
            reason: 'AUTOMATED_TIME_EXPIRATION'
          }, { jobId: `close-${id}`, removeOnComplete: true });
        } else {
          // Direct fallback execution if BullMQ/Redis is unavailable
          await AuctionService.closeAuction(id, 'AUTOMATED_TIME_EXPIRATION');
          const io = getIO();
          if (io) {
            io.to(`auction:${id}`).emit('auction:closed', { auctionId: id });
          }
        }
      }
    } catch (err) {
      logger.warn({ error: err.message }, 'Error in auction sweeper cycle');
    }
  }, 10000); // 10s sweep interval

  sweepIntervalId.unref(); // Do not prevent process exit
}

export function stopAuctionWorker() {
  if (sweepIntervalId) clearInterval(sweepIntervalId);
  if (auctionWorker) auctionWorker.close();
}
