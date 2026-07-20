import { z } from 'zod';
export declare const slotSchema: z.ZodObject<{
    slotStart: z.ZodString;
    isAvailable: z.ZodBoolean;
    capacity: z.ZodNumber;
    bookedCount: z.ZodNumber;
}, z.core.$strip>;
export type Slot = z.infer<typeof slotSchema>;
