import { z } from 'zod';
import { bookingStatusSchema, priorityTierSchema } from './booking';
import { PH_PHONE_REGEX } from '../utils/phone';

export const queuePositionSchema = z.object({
  bookingId: z.string(),
  position: z.number().int().nonnegative(),
  peopleAhead: z.number().int().nonnegative(),
  estimatedWaitMin: z.number().int().nonnegative(),
  slotStart: z.string().datetime(),
  status: bookingStatusSchema,
  ticketNumber: z.number().int().positive().nullable().optional(),
  priorityTier: priorityTierSchema.default('STANDARD'),
});
export type QueuePosition = z.infer<typeof queuePositionSchema>;

export const queueSnapshotSchema = z.object({
  businessId: z.string(),
  totalActive: z.number().int().nonnegative(),
  lastUpdatedAt: z.string().datetime(),
});
export type QueueSnapshot = z.infer<typeof queueSnapshotSchema>;

export const queueBookingChangedSchema = z.object({
  bookingId: z.string(),
  status: bookingStatusSchema,
  slotStart: z.iso.datetime(),
});
export type QueueBookingChanged = z.infer<typeof queueBookingChangedSchema>;

/// Emitted when the head-of-queue (the currently-serving booking) changes,
/// e.g. after call-next, complete, or skip. `bookingId` is null when the
/// queue has no one serving.
export const queueHeadChangedSchema = z.object({
  businessId: z.string(),
  bookingId: z.string().nullable(),
  ticketNumber: z.number().int().positive().nullable(),
  status: bookingStatusSchema.nullable(),
});
export type QueueHeadChanged = z.infer<typeof queueHeadChangedSchema>;

// -----------------------------------------------------------------------------
// Live queue (owner dashboard)
// -----------------------------------------------------------------------------

/// One row in the owner's live queue view for the current business day.
export const liveQueueEntrySchema = z.object({
  bookingId: z.string(),
  ticketNumber: z.number().int().positive().nullable(),
  customerName: z.string(),
  customerPhone: z.string(),
  serviceId: z.string(),
  serviceName: z.string().optional(),
  status: bookingStatusSchema,
  priorityTier: priorityTierSchema,
  source: z.enum(['ONLINE', 'WALK_IN', 'STAFF', 'IMPORT']),
  slotStart: z.string().datetime(),
  /// 1-based ordinal among today's still-waiting bookings; null once terminal.
  position: z.number().int().positive().nullable(),
  recallCount: z.number().int().nonnegative(),
});
export type LiveQueueEntry = z.infer<typeof liveQueueEntrySchema>;

export const liveQueueSchema = z.object({
  businessId: z.string(),
  entries: z.array(liveQueueEntrySchema),
  /// The currently-serving booking id, or null when nobody is at the counter.
  servingBookingId: z.string().nullable(),
  lastUpdatedAt: z.string().datetime(),
});
export type LiveQueue = z.infer<typeof liveQueueSchema>;

// -----------------------------------------------------------------------------
// Owner-side queue actions (dashboard)
// -----------------------------------------------------------------------------

/// Walk-in registration (#16). Owner adds a customer directly to the queue.
export const walkInInputSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  customerPhone: z
    .string()
    .trim()
    .regex(PH_PHONE_REGEX, 'Please enter a valid Philippine mobile number'),
  notes: z.string().optional().nullable(),
  priorityTier: priorityTierSchema.optional().default('STANDARD'),
});
export type WalkInInput = z.infer<typeof walkInInputSchema>;

/// Skip a customer (#20) — optional structured reason for the audit log.
export const skipReasonSchema = z.enum(['no_show', 'wrong_queue', 'left']);
export type SkipReason = z.infer<typeof skipReasonSchema>;

export const skipBookingInputSchema = z.object({
  reason: skipReasonSchema.optional().default('no_show'),
});
export type SkipBookingInput = z.infer<typeof skipBookingInputSchema>;

/// Owner cancel-on-behalf (#21).
export const cancelBookingInputSchema = z.object({
  reason: z.string().trim().max(280).optional().nullable(),
});
export type CancelBookingInput = z.infer<typeof cancelBookingInputSchema>;

/// Transfer a booking to another service (#22).
export const transferBookingInputSchema = z.object({
  targetServiceId: z.string().min(1, 'Target service is required'),
  /// Optional new slot; when omitted the API keeps the existing slotStart.
  slotStart: z.string().datetime().optional(),
});
export type TransferBookingInput = z.infer<typeof transferBookingInputSchema>;

/// Set a customer's priority tier from the live queue (#18).
export const setPriorityInputSchema = z.object({
  priorityTier: priorityTierSchema,
});
export type SetPriorityInput = z.infer<typeof setPriorityInputSchema>;

// -----------------------------------------------------------------------------
// Queue history (#25)
// -----------------------------------------------------------------------------

export const queueHistoryEntrySchema = z.object({
  bookingId: z.string(),
  ticketNumber: z.number().int().positive().nullable(),
  customerName: z.string(),
  customerPhone: z.string(),
  serviceId: z.string(),
  serviceName: z.string().optional(),
  status: bookingStatusSchema,
  priorityTier: priorityTierSchema,
  slotStart: z.string().datetime(),
  servingAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  cancelledAt: z.string().datetime().nullable(),
  /// Minutes waited from slotStart (or createdAt) until served. Null when
  /// the booking never reached SERVING.
  waitMin: z.number().int().nonnegative().nullable(),
});
export type QueueHistoryEntry = z.infer<typeof queueHistoryEntrySchema>;

export const waitTimeStatsSchema = z.object({
  totalServed: z.number().int().nonnegative(),
  totalNoShow: z.number().int().nonnegative(),
  totalCancelled: z.number().int().nonnegative(),
  /// Average wait in minutes across served bookings; 0 when none served.
  avgWaitMin: z.number().nonnegative(),
  /// No-show rate as a fraction 0..1 across resolved bookings.
  noShowRate: z.number().min(0).max(1),
});
export type WaitTimeStats = z.infer<typeof waitTimeStatsSchema>;

export const queueHistoryQuerySchema = z.object({
  /// Local calendar date (YYYY-MM-DD) in the business timezone.
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceId: z.string().optional(),
  status: bookingStatusSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type QueueHistoryQuery = z.infer<typeof queueHistoryQuerySchema>;

export const queueHistoryResponseSchema = z.object({
  entries: z.array(queueHistoryEntrySchema),
  stats: waitTimeStatsSchema,
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type QueueHistoryResponse = z.infer<typeof queueHistoryResponseSchema>;
