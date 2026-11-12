import { z } from 'zod';

export const placeBidSchema = z.object({
  auctionId: z.string().uuid('Invalid auction ID'),
  amount: z.number().positive('Bid amount must be positive')
});

export const setProxyBidSchema = z.object({
  auctionId: z.string().uuid('Invalid auction ID'),
  maxAmount: z.number().positive('Max proxy bid amount must be positive')
});
