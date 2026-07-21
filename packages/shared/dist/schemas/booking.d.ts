import { z } from 'zod';
export declare const bookingStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    CONFIRMED: "CONFIRMED";
    CHECKED_IN: "CHECKED_IN";
    SERVING: "SERVING";
    COMPLETED: "COMPLETED";
    NO_SHOW: "NO_SHOW";
    CANCELLED: "CANCELLED";
}>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export declare const priorityTierSchema: z.ZodEnum<{
    VIP: "VIP";
    PREGNANT: "PREGNANT";
    PWD: "PWD";
    SENIOR: "SENIOR";
    STANDARD: "STANDARD";
}>;
export type PriorityTier = z.infer<typeof priorityTierSchema>;
export declare const PRIORITY_TIER_RANK: Record<PriorityTier, number>;
export declare const cancelledBySchema: z.ZodEnum<{
    CUSTOMER: "CUSTOMER";
    OWNER: "OWNER";
    SYSTEM: "SYSTEM";
}>;
export type CancelledBy = z.infer<typeof cancelledBySchema>;
export declare const createBookingInputSchema: z.ZodObject<{
    serviceId: z.ZodString;
    slotStart: z.ZodString;
    customerName: z.ZodString;
    customerPhone: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priorityTier: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        VIP: "VIP";
        PREGNANT: "PREGNANT";
        PWD: "PWD";
        SENIOR: "SENIOR";
        STANDARD: "STANDARD";
    }>>>;
}, z.core.$strip>;
export declare const createBookingSchema: z.ZodPipe<z.ZodObject<{
    serviceId: z.ZodString;
    slotStart: z.ZodString;
    customerName: z.ZodString;
    customerPhone: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priorityTier: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        VIP: "VIP";
        PREGNANT: "PREGNANT";
        PWD: "PWD";
        SENIOR: "SENIOR";
        STANDARD: "STANDARD";
    }>>>;
}, z.core.$strip>, z.ZodTransform<{
    customerPhone: string;
    serviceId: string;
    slotStart: string;
    customerName: string;
    priorityTier: "VIP" | "PREGNANT" | "PWD" | "SENIOR" | "STANDARD";
    notes?: string | null | undefined;
}, {
    serviceId: string;
    slotStart: string;
    customerName: string;
    customerPhone: string;
    priorityTier: "VIP" | "PREGNANT" | "PWD" | "SENIOR" | "STANDARD";
    notes?: string | null | undefined;
}>>;
export declare const bookingSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    businessId: z.ZodString;
    serviceId: z.ZodString;
    slotStart: z.ZodCoercedDate<unknown>;
    ticketNumber: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
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
        SERVING: "SERVING";
        COMPLETED: "COMPLETED";
        NO_SHOW: "NO_SHOW";
        CANCELLED: "CANCELLED";
    }>;
    priorityTier: z.ZodDefault<z.ZodEnum<{
        VIP: "VIP";
        PREGNANT: "PREGNANT";
        PWD: "PWD";
        SENIOR: "SENIOR";
        STANDARD: "STANDARD";
    }>>;
    idempotencyKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    resolvedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
    servingAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
    recallCount: z.ZodDefault<z.ZodNumber>;
    completedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
    cancelledAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
    cancelledBy: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        CUSTOMER: "CUSTOMER";
        OWNER: "OWNER";
        SYSTEM: "SYSTEM";
    }>>>;
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
        ticketNumber: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
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
            SERVING: "SERVING";
            COMPLETED: "COMPLETED";
            NO_SHOW: "NO_SHOW";
            CANCELLED: "CANCELLED";
        }>;
        priorityTier: z.ZodDefault<z.ZodEnum<{
            VIP: "VIP";
            PREGNANT: "PREGNANT";
            PWD: "PWD";
            SENIOR: "SENIOR";
            STANDARD: "STANDARD";
        }>>;
        idempotencyKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        resolvedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
        servingAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
        recallCount: z.ZodDefault<z.ZodNumber>;
        completedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
        cancelledAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
        cancelledBy: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            CUSTOMER: "CUSTOMER";
            OWNER: "OWNER";
            SYSTEM: "SYSTEM";
        }>>>;
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
