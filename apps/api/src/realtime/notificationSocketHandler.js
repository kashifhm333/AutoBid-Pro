import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

export function registerNotificationSocketHandlers(io, socket) {
  /**
   * Client marks a notification as read
   */
  socket.on('notification:read', async ({ notificationId }) => {
    try {
      if (!socket.user) return;

      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: socket.user.id
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      socket.emit('notification:read_ack', { notificationId });
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed to acknowledge notification read');
    }
  });
}

/**
 * Dispatches a real-time notification to a specific user's private socket room
 */
export function dispatchRealTimeNotification(io, userId, notification) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
}
