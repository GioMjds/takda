import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const workingHoursSchema = z.object({
  id: z.string().optional(),
  businessId: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(timeRegex, "Time must be in HH:mm format"),
  closeTime: z.string().regex(timeRegex, "Time must be in HH:mm format"),
  isClosed: z.boolean().default(false),
});

export const upsertWorkingHoursInputSchema = z.object({
  hours: z.array(workingHoursSchema).min(1).max(7),
});

export type WorkingHours = z.infer<typeof workingHoursSchema>;
export type UpsertWorkingHoursInput = z.infer<typeof upsertWorkingHoursInputSchema>;
