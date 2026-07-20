import {
  CreateBookingInput,
  QueueTokenResponse,
  queueTokenResponseSchema,
} from '@takda/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function createBooking(
  businessSlug: string,
  input: CreateBookingInput,
  idempotencyKey: string,
): Promise<QueueTokenResponse> {
  const res = await fetch(
    `${API_BASE}/v1/businesses/${businessSlug}/bookings`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(input),
    },
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create booking');
  }

  return queueTokenResponseSchema.parse(data);
}

export async function refreshQueueToken(
  bookingId: string,
  phone: string,
): Promise<QueueTokenResponse> {
  const res = await fetch(`${API_BASE}/v1/bookings/${bookingId}/queue-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to refresh queue token');
  }

  return queueTokenResponseSchema.parse(data);
}
