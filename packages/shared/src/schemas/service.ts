import { z } from 'zod';

export const serviceSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  slug: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  durationMin: z.number().int().positive(),
  capacityPerSlot: z.number().int().positive().default(1),
  dailyCapacity: z.number().int().positive().nullable().optional(),
  openTime: z.string(),
  closeTime: z.string(),
  daysOfWeekMask: z.number().int().default(127),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Service = z.infer<typeof serviceSchema>;
