import { z } from 'zod';
export declare const bookingStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    CONFIRMED: "CONFIRMED";
    CHECKED_IN: "CHECKED_IN";
    NO_SHOW: "NO_SHOW";
    CANCELLED: "CANCELLED";
}>;
export declare const createBookingInputSchema: z.ZodObject<{
    serviceId: z.ZodString;
    slotStart: z.ZodString;
    customerName: z.ZodString;
    customerPhone: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const createBookingSchema: z.ZodPipe<z.ZodObject<{
    serviceId: z.ZodString;
    slotStart: z.ZodString;
    customerName: z.ZodString;
    customerPhone: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>, z.ZodTransform<{
    customerPhone: string;
    serviceId: string;
    slotStart: string;
    customerName: string;
    notes?: string | null | undefined;
}, {
    serviceId: string;
    slotStart: string;
    customerName: string;
    customerPhone: string;
    notes?: string | null | undefined;
}>>;
export declare const bookingSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    businessId: z.ZodString;
    serviceId: z.ZodString;
    slotStart: z.ZodDate;
    customerName: z.ZodString;
    customerPhone: z.ZodString;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    source: z.ZodEnum<{
        ONLINE: "ONLINE";
        WALK_IN: "WALK_IN";
        STAFF: "STAFF";
        IMPORT: "IMPORT";
    }>;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        CONFIRMED: "CONFIRMED";
        CHECKED_IN: "CHECKED_IN";
        NO_SHOW: "NO_SHOW";
        CANCELLED: "CANCELLED";
    }>;
    idempotencyKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    resolvedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type CreateBookingInput = z.input<typeof createBookingSchema>;
export type CreateBookingOutput = z.output<typeof createBookingSchema>;
export type Booking = z.infer<typeof bookingSchema>;
