import { z } from 'zod';
export declare const businessSlugSchema: z.ZodString;
export declare const businessSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    slug: z.ZodString;
    name: z.ZodString;
    timezone: z.ZodDefault<z.ZodString>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type Business = z.infer<typeof businessSchema>;
