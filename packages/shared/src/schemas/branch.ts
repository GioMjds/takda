import { z } from 'zod';

export const branchSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string().min(1, 'Branch name is required').max(100),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBranchInputSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(100),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const updateBranchInputSchema = createBranchInputSchema.partial();

export const listBranchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export type Branch = z.infer<typeof branchSchema>;
export type CreateBranchInput = z.infer<typeof createBranchInputSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchInputSchema>;
export type ListBranchesQuery = z.infer<typeof listBranchesQuerySchema>;
