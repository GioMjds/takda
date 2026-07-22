import { z } from 'zod';
import { membershipRoleSchema } from './employee';

export const createInviteInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: membershipRoleSchema.default('STAFF'),
});

export type CreateInviteInput = z.infer<typeof createInviteInputSchema>;

export const acceptInviteInputSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  name: z.string().min(1, 'Name is required').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
});

export type AcceptInviteInput = z.infer<typeof acceptInviteInputSchema>;

export const staffInviteSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  email: z.string().email(),
  role: membershipRoleSchema,
  tokenHash: z.string(),
  invitedById: z.string(),
  expiresAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable(),
  revokedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export type StaffInvite = z.infer<typeof staffInviteSchema>;
