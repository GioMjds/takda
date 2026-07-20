import { z } from 'zod';
import { bookingStatusSchema } from './booking';

export const queuePositionSchema = z.object({
  bookingId: z.string(),
  position: z.number().int().nonnegative(),
  peopleAhead: z.number().int().nonnegative(),
  estimatedWaitMin: z.number().int().nonnegative(),
  slotStart: z.string().datetime(),
  status: bookingStatusSchema,
});
export type QueuePosition = z.infer<typeof queuePositionSchema>;

export const queueSnapshotSchema = z.object({
  businessId: z.string(),
  totalActive: z.number().int().nonnegative(),
  lastUpdatedAt: z.string().datetime(),
});
export type QueueSnapshot = z.infer<typeof queueSnapshotSchema>;

export const queueBookingChangedSchema = z.object({
  bookingId: z.string(),
  status: bookingStatusSchema,
  slotStart: z.iso.datetime(),
});
export type QueueBookingChanged = z.infer<typeof queueBookingChangedSchema>;
