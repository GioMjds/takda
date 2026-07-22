import { z } from 'zod';
import { PH_PHONE_REGEX, normalizePhone } from '../utils/phone';

export const bookingStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'SERVING',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

/// Queue prioritization tiers, highest priority first. Mirrors the Prisma
/// `PriorityTier` enum. Ordering sorts by tier rank before slotStart.
export const priorityTierSchema = z.enum([
  'VIP',
  'PREGNANT',
  'PWD',
  'SENIOR',
  'STANDARD',
]);
export type PriorityTier = z.infer<typeof priorityTierSchema>;

/// Lower rank number = higher priority (sorts first). Extend by appending
/// tiers to the enum and a rank here; unknown tiers fall back to STANDARD.
export const PRIORITY_TIER_RANK: Record<PriorityTier, number> = {
  VIP: 0,
  PREGNANT: 1,
  PWD: 2,
  SENIOR: 3,
  STANDARD: 4,
};

export const cancelledBySchema = z.enum(['CUSTOMER', 'OWNER', 'SYSTEM']);
export type CancelledBy = z.infer<typeof cancelledBySchema>;

export const createBookingInputSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  slotStart: z.string().datetime({ message: 'Invalid slot time format' }),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  customerPhone: z
    .string()
    .trim()
    .regex(
      PH_PHONE_REGEX,
      'Please enter a valid Philippine mobile number (e.g. 09171234567)',
    ),
  notes: z.string().optional().nullable(),
  /// Optional self-declared priority tier. Defaults to STANDARD. Higher tiers
  /// require an honor-system acknowledgement in the booking UI (v1).
  priorityTier: priorityTierSchema.optional().default('STANDARD'),
});

export const createBookingSchema = createBookingInputSchema.transform(
  (data) => ({
    ...data,
    customerPhone: normalizePhone(data.customerPhone),
  }),
);

export const bookingSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  businessId: z.string(),
  serviceId: z.string(),
  slotStart: z.coerce.date(),
  ticketNumber: z.number().int().positive().nullable().optional(),
  customerName: z.string(),
  customerPhone: z.string(),
  notes: z.string().nullable().optional(),
  source: z.enum(['ONLINE', 'WALK_IN', 'STAFF', 'IMPORT']),
  status: bookingStatusSchema,
  priorityTier: priorityTierSchema.default('STANDARD'),
  idempotencyKey: z.string().nullable().optional(),
  resolvedAt: z.coerce.date().nullable().optional(),
  servingAt: z.coerce.date().nullable().optional(),
  recallCount: z.number().int().nonnegative().default(0),
  completedAt: z.coerce.date().nullable().optional(),
  cancelledAt: z.coerce.date().nullable().optional(),
  cancelledBy: cancelledBySchema.nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CreateBookingInput = z.input<typeof createBookingSchema>;
export type CreateBookingOutput = z.output<typeof createBookingSchema>;
export type Booking = z.infer<typeof bookingSchema>;

export const queueTokenClaimsSchema = z.object({
  sub: z.string(), // bookingId
  businessId: z.string(),
  role: z.literal('customer'),
  iat: z.number(),
  exp: z.number(),
});
export type QueueTokenClaims = z.infer<typeof queueTokenClaimsSchema>;

export const queueTokenResponseSchema = z.object({
  booking: bookingSchema,
  queueToken: z.string(),
  queueTokenExpiresAt: z.string().datetime(),
});
export type QueueTokenResponse = z.infer<typeof queueTokenResponseSchema>;

export const refreshQueueTokenInputSchema = z.object({
  phone: z.string().regex(PH_PHONE_REGEX),
});
export type RefreshQueueTokenInput = z.infer<
  typeof refreshQueueTokenInputSchema
>;
