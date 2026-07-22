"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshQueueTokenInputSchema = exports.queueTokenResponseSchema = exports.queueTokenClaimsSchema = exports.bookingSchema = exports.createBookingSchema = exports.createBookingInputSchema = exports.cancelledBySchema = exports.PRIORITY_TIER_RANK = exports.priorityTierSchema = exports.bookingStatusSchema = void 0;
const zod_1 = require("zod");
const phone_1 = require("../utils/phone");
exports.bookingStatusSchema = zod_1.z.enum([
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'SERVING',
    'COMPLETED',
    'NO_SHOW',
    'CANCELLED',
]);
/// Queue prioritization tiers, highest priority first. Mirrors the Prisma
/// `PriorityTier` enum. Ordering sorts by tier rank before slotStart.
exports.priorityTierSchema = zod_1.z.enum([
    'VIP',
    'PREGNANT',
    'PWD',
    'SENIOR',
    'STANDARD',
]);
/// Lower rank number = higher priority (sorts first). Extend by appending
/// tiers to the enum and a rank here; unknown tiers fall back to STANDARD.
exports.PRIORITY_TIER_RANK = {
    VIP: 0,
    PREGNANT: 1,
    PWD: 2,
    SENIOR: 3,
    STANDARD: 4,
};
exports.cancelledBySchema = zod_1.z.enum(['CUSTOMER', 'OWNER', 'SYSTEM']);
exports.createBookingInputSchema = zod_1.z.object({
    serviceId: zod_1.z.string().min(1, 'Service is required'),
    slotStart: zod_1.z.string().datetime({ message: 'Invalid slot time format' }),
    customerName: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters'),
    customerPhone: zod_1.z
        .string()
        .trim()
        .regex(phone_1.PH_PHONE_REGEX, 'Please enter a valid Philippine mobile number (e.g. 09171234567)'),
    notes: zod_1.z.string().optional().nullable(),
    /// Optional self-declared priority tier. Defaults to STANDARD. Higher tiers
    /// require an honor-system acknowledgement in the booking UI (v1).
    priorityTier: exports.priorityTierSchema.optional().default('STANDARD'),
});
exports.createBookingSchema = exports.createBookingInputSchema.transform((data) => ({
    ...data,
    customerPhone: (0, phone_1.normalizePhone)(data.customerPhone),
}));
exports.bookingSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tenantId: zod_1.z.string(),
    businessId: zod_1.z.string(),
    serviceId: zod_1.z.string(),
    slotStart: zod_1.z.coerce.date(),
    ticketNumber: zod_1.z.number().int().positive().nullable().optional(),
    customerName: zod_1.z.string(),
    customerPhone: zod_1.z.string(),
    notes: zod_1.z.string().nullable().optional(),
    source: zod_1.z.enum(['ONLINE', 'WALK_IN', 'STAFF', 'IMPORT']),
    status: exports.bookingStatusSchema,
    priorityTier: exports.priorityTierSchema.default('STANDARD'),
    idempotencyKey: zod_1.z.string().nullable().optional(),
    resolvedAt: zod_1.z.coerce.date().nullable().optional(),
    servingAt: zod_1.z.coerce.date().nullable().optional(),
    recallCount: zod_1.z.number().int().nonnegative().default(0),
    completedAt: zod_1.z.coerce.date().nullable().optional(),
    cancelledAt: zod_1.z.coerce.date().nullable().optional(),
    cancelledBy: exports.cancelledBySchema.nullable().optional(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
});
exports.queueTokenClaimsSchema = zod_1.z.object({
    sub: zod_1.z.string(), // bookingId
    businessId: zod_1.z.string(),
    role: zod_1.z.literal('customer'),
    iat: zod_1.z.number(),
    exp: zod_1.z.number(),
});
exports.queueTokenResponseSchema = zod_1.z.object({
    booking: exports.bookingSchema,
    queueToken: zod_1.z.string(),
    queueTokenExpiresAt: zod_1.z.string().datetime(),
});
exports.refreshQueueTokenInputSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(phone_1.PH_PHONE_REGEX),
});
//# sourceMappingURL=booking.js.map