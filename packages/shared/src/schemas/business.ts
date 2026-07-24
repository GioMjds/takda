import { z } from 'zod';
import { businessSettingsSchema } from './business-settings';

export const businessSlugSchema = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(
    /^[a-z0-9-]+$/u,
    'Slug must contain only lowercase letters, numbers, and hyphens',
  );

export const businessSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  slug: businessSlugSchema,
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().default('Asia/Manila'),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  settings: businessSettingsSchema.default({}),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBusinessInputSchema = z.object({
  slug: businessSlugSchema,
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().default('Asia/Manila'),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  settings: businessSettingsSchema.optional(),
});

export const updateBusinessInputSchema = createBusinessInputSchema.partial();

export const listBusinessQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessInputSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessInputSchema>;
export type ListBusinessesQuery = z.infer<typeof listBusinessQuerySchema>;

export type Business = z.infer<typeof businessSchema>;
