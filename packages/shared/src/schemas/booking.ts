import { z } from 'zod';
import { PH_PHONE_REGEX, normalizePhone } from '../utils/phone';

export const bookingStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'NO_SHOW',
  'CANCELLED',
]);

export const createBookingInputSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  slotStart: z.string().datetime({ message: 'Invalid slot time format' }),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().trim().regex(PH_PHONE_REGEX, 'Please enter a valid Philippine mobile number (e.g. 09171234567)'),
  notes: z.string().optional().nullable(),
});

export const createBookingSchema = createBookingInputSchema.transform((data) => ({
  ...data,
  customerPhone: normalizePhone(data.customerPhone),
}));

export const bookingSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  businessId: z.string(),
  serviceId: z.string(),
  slotStart: z.date(),
  customerName: z.string(),
  customerPhone: z.string(),
  notes: z.string().nullable().optional(),
  source: z.enum(['ONLINE', 'WALK_IN', 'STAFF', 'IMPORT']),
  status: bookingStatusSchema,
  idempotencyKey: z.string().nullable().optional(),
  resolvedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateBookingInput = z.input<typeof createBookingSchema>;
export type CreateBookingOutput = z.output<typeof createBookingSchema>;
export type Booking = z.infer<typeof bookingSchema>;
