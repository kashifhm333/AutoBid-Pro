import { z } from 'zod';

export const createAuctionSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  startingPrice: z.number().positive('Starting price must be positive'),
  reservePrice: z.number().positive('Reserve price must be positive').optional(),
  minimumIncrement: z.number().positive('Minimum increment must be positive').default(100),
  startTime: z.string().datetime('Invalid start ISO timestamp'),
  endTime: z.string().datetime('Invalid end ISO timestamp'),
  depositRequired: z.number().nonnegative().default(500),
  currency: z.string().length(3).default('USD')
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be strictly after start time',
  path: ['endTime']
});

export const updateAuctionSchema = z.object({
  reservePrice: z.number().positive().optional(),
  minimumIncrement: z.number().positive().optional(),
  endTime: z.string().datetime().optional()
});
