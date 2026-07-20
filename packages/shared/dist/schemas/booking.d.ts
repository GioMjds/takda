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
    slotStart: z.ZodCoercedDate<unknown>;
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
    resolvedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export type CreateBookingInput = z.input<typeof createBookingSchema>;
export type CreateBookingOutput = z.output<typeof createBookingSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export declare const queueTokenClaimsSchema: z.ZodObject<{
    sub: z.ZodString;
    businessId: z.ZodString;
    role: z.ZodLiteral<"customer">;
    iat: z.ZodNumber;
    exp: z.ZodNumber;
}, z.core.$strip>;
export type QueueTokenClaims = z.infer<typeof queueTokenClaimsSchema>;
export declare const queueTokenResponseSchema: z.ZodObject<{
    booking: z.ZodObject<{
        id: z.ZodString;
        tenantId: z.ZodString;
        businessId: z.ZodString;
        serviceId: z.ZodString;
        slotStart: z.ZodCoercedDate<unknown>;
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
        resolvedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
        createdAt: z.ZodCoercedDate<unknown>;
        updatedAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>;
    queueToken: z.ZodString;
    queueTokenExpiresAt: z.ZodString;
}, z.core.$strip>;
export type QueueTokenResponse = z.infer<typeof queueTokenResponseSchema>;
export declare const refreshQueueTokenInputSchema: z.ZodObject<{
    phone: z.ZodString;
}, z.core.$strip>;
export type RefreshQueueTokenInput = z.infer<typeof refreshQueueTokenInputSchema>;
