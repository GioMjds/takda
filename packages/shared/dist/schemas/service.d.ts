import { z } from 'zod';
export declare const serviceSchema: z.ZodObject<{
    id: z.ZodString;
    businessId: z.ZodString;
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    durationMin: z.ZodNumber;
    capacityPerSlot: z.ZodDefault<z.ZodNumber>;
    dailyCapacity: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    openTime: z.ZodString;
    closeTime: z.ZodString;
    daysOfWeekMask: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type Service = z.infer<typeof serviceSchema>;
