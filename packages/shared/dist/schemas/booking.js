"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshQueueTokenInputSchema = exports.queueTokenResponseSchema = exports.queueTokenClaimsSchema = exports.bookingSchema = exports.createBookingSchema = exports.createBookingInputSchema = exports.bookingStatusSchema = void 0;
const zod_1 = require("zod");
const phone_1 = require("../utils/phone");
exports.bookingStatusSchema = zod_1.z.enum([
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'NO_SHOW',
    'CANCELLED',
]);
exports.createBookingInputSchema = zod_1.z.object({
    serviceId: zod_1.z.string().min(1, 'Service is required'),
    slotStart: zod_1.z.string().datetime({ message: 'Invalid slot time format' }),
    customerName: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters'),
    customerPhone: zod_1.z.string().trim().regex(phone_1.PH_PHONE_REGEX, 'Please enter a valid Philippine mobile number (e.g. 09171234567)'),
    notes: zod_1.z.string().optional().nullable(),
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
    customerName: zod_1.z.string(),
    customerPhone: zod_1.z.string(),
    notes: zod_1.z.string().nullable().optional(),
    source: zod_1.z.enum(['ONLINE', 'WALK_IN', 'STAFF', 'IMPORT']),
    status: exports.bookingStatusSchema,
    idempotencyKey: zod_1.z.string().nullable().optional(),
    resolvedAt: zod_1.z.coerce.date().nullable().optional(),
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