import { BiddingService } from '../modules/bidding/biddingService.js';
import { logger } from '../config/logger.js';

// Active viewer counts per auction
const auctionViewers = new Map();

export function registerAuctionSocketHandlers(io, socket) {
  /**
   * Client subscribes to real-time events for a specific auction
   */
  socket.on('auction:join', ({ auctionId }) => {
    if (!auctionId) return;

    const roomName = `auction:${auctionId}`;
    socket.join(roomName);

    // Track room viewers
    const currentCount = (auctionViewers.get(auctionId) || 0) + 1;
    auctionViewers.set(auctionId, currentCount);

    // Send authoritative server time sync immediately
    socket.emit('timer:sync', {
      serverTime: Date.now(),
      auctionId
    });

    // Broadcast updated viewer count to room
    io.to(roomName).emit('auction:viewers', {
      auctionId,
      viewersCount: currentCount
    });

    logger.debug({ socketId: socket.id, auctionId, viewersCount: currentCount }, 'Client joined auction room');
  });

  /**
   * Client unsubscribes from auction room
   */
  socket.on('auction:leave', ({ auctionId }) => {
    if (!auctionId) return;

    const roomName = `auction:${auctionId}`;
    socket.leave(roomName);

    const currentCount = Math.max(0, (auctionViewers.get(auctionId) || 1) - 1);
    auctionViewers.set(auctionId, currentCount);

    io.to(roomName).emit('auction:viewers', {
      auctionId,
      viewersCount: currentCount
    });
  });

  /**
   * Client places a real-time bid over WebSocket
   */
  socket.on('bid:place', async ({ auctionId, amount }) => {
    try {
      if (!socket.user) {
        return socket.emit('bid:error', {
          code: 'UNAUTHENTICATED',
          message: 'You must be logged in to place bids'
        });
      }

      const ipAddress = socket.handshake.address || socket.conn.remoteAddress;

      const result = await BiddingService.placeBid({
        auctionId,
        bidderId: socket.user.id,
        amount: Number(amount),
        ipAddress
      });

      const roomName = `auction:${auctionId}`;

      // 1. Confirm bid to the submitting client
      socket.emit('bid:confirmed', {
        bidId: result.bid.id,
        amount: result.bid.amount,
        createdAt: result.bid.createdAt
      });

      // 2. Broadcast new bid to all clients watching this auction
      io.to(roomName).emit('bid:new', {
        auctionId,
        bidId: result.bid.id,
        amount: Number(result.bid.amount),
        bidderName: result.bid.bidder ? `${result.bid.bidder.firstName} ***` : 'Bidder',
        bidCount: result.auction.bidCount,
        createdAt: result.bid.createdAt
      });

      // 3. Broadcast Anti-Sniping Soft-Close Extension if triggered
      if (result.isExtended) {
        io.to(roomName).emit('auction:extended', {
          auctionId,
          newEndTime: result.newEndTime,
          extensionCount: result.auction.extensionCount,
          reason: 'Anti-sniping auto-extension (+2 mins)'
        });

        logger.info({
          auctionId,
          newEndTime: result.newEndTime,
          extensionCount: result.auction.extensionCount
        }, 'Auction clock extended via anti-sniping soft-close');
      }

      // 4. If an automated proxy counter-bid was placed, broadcast it immediately
      if (result.autoCounterBid) {
        setTimeout(() => {
          io.to(roomName).emit('bid:new', {
            auctionId,
            bidId: result.autoCounterBid.id,
            amount: Number(result.autoCounterBid.amount),
            bidderName: 'Proxy Auto-Bid',
            isProxy: true,
            bidCount: result.auction.bidCount + 1,
            createdAt: result.autoCounterBid.createdAt
          });
        }, 500); // 500ms realistic delay for proxy response
      }

    } catch (error) {
      logger.warn({ error: error.message, auctionId, userId: socket.user?.id }, 'WebSocket bid rejected');
      socket.emit('bid:error', {
        code: error.code || 'BID_REJECTED',
        message: error.message
      });
    }
  });
}
