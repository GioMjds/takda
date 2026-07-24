import { z } from 'zod';

export const businessSettingsSchema = z
  .object({
    defaultReminderLeadMinutes: z
      .enum(['10', '30', '60'])
      .or(z.number())
      .default(30),
    smsOptIn: z.boolean().default(true),
    language: z.enum(['en', 'tl']).default('en'),
    bookingCutoffMinutes: z.number().int().min(0).default(0)
  })
  .strict();

export const updateBusinessSettingsSchema = businessSettingsSchema.partial().strict();

export type BusinessSettings = z.infer<typeof businessSettingsSchema>;

export type UpdateBusinessSettingsInput = z.infer<typeof updateBusinessSettingsSchema>;
