import { z } from 'zod';

export const slotSchema = z.object({
  slotStart: z.string().datetime(), // UTC ISO String
  isAvailable: z.boolean(),
  capacity: z.number().int(),
  bookedCount: z.number().int(),
});

export type Slot = z.infer<typeof slotSchema>;
