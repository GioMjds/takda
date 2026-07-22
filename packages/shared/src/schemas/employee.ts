import { z } from 'zod';

export const membershipRoleSchema = z.enum(['OWNER', 'MANAGER', 'STAFF']);

export const employeeUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
});

export const employeeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessId: z.string(),
  role: membershipRoleSchema,
  createdAt: z.date(),
  user: employeeUserSchema,
});

export const createEmployeeInputSchema = z
  .object({
    userId: z.string().optional(),
    name: z.string().min(1, 'Name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    role: membershipRoleSchema.default('STAFF'),
  })
  .superRefine((data, ctx) => {
    if (!data.userId && (!data.name || !data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must provide either existing userId or inline name and email',
        path: ['userId'],
      });
    }
  });

export const updateEmployeeInputSchema = z.object({
  role: membershipRoleSchema,
});

export const listEmployeesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  role: membershipRoleSchema.optional(),
});

export type MembershipRole = z.infer<typeof membershipRoleSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeInputSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeInputSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type Employee = z.infer<typeof employeeSchema>;
