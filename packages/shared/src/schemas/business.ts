import { z } from 'zod';

export const businessSlugSchema = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(/^[a-z0-9-]+$/u, 'Slug must contain only lowercase letters, numbers, and hyphens');

export const businessSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  slug: businessSlugSchema,
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().default('Asia/Manila'),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Business = z.infer<typeof businessSchema>;
