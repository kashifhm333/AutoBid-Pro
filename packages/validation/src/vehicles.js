import { z } from 'zod';

export const createVehicleSchema = z.object({
  vin: z.string().length(17, 'VIN must be exactly 17 characters').toUpperCase(),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  trim: z.string().max(50).optional(),
  mileage: z.number().int().min(0),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC', 'HYDROGEN']),
  transmission: z.enum(['AUTOMATIC', 'MANUAL', 'DUAL_CLUTCH', 'CVT']),
  engine: z.string().max(100).optional(),
  driveType: z.enum(['FWD', 'RWD', 'AWD', 'FOUR_WD']),
  exteriorColor: z.string().min(1).max(50),
  interiorColor: z.string().min(1).max(50),
  bodyType: z.enum(['SEDAN', 'COUPE', 'SUV', 'TRUCK', 'CONVERTIBLE', 'WAGON', 'HATCHBACK', 'VAN', 'SUPERCAR']),
  doors: z.number().int().min(2).max(6).default(4),
  seats: z.number().int().min(1).max(12).default(5),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().default('USA'),
  postalCode: z.string().min(1).max(20),
  titleStatus: z.enum(['CLEAN', 'SALVAGE', 'REBUILT', 'LEMON', 'BONDED']).default('CLEAN'),
  condition: z.enum(['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR']).default('EXCELLENT'),
  hasAccidentHistory: z.boolean().default(false),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  highlights: z.array(z.string()).default([]),
  equipmentNotes: z.string().optional(),
  knownFlaws: z.string().optional()
});

export const updateVehicleSchema = createVehicleSchema.partial();
