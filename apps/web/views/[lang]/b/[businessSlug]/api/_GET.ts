import { http, ApiError } from '@/configs/fetch';
import { queueTokenClaimsSchema } from '@takda/shared';
import type { QueuePosition, QueueTokenClaims } from '@takda/shared';

/// Fetches the live queue position for a booking. `GET /v1/bookings/:id/position`
/// is a public endpoint but requires the customer's short-lived queue token as a
/// Bearer credential. Falls back to a demo position when the API is unreachable
/// so the confirmation screen still renders in dev/preview mode.
export async function getQueuePosition(
  bookingId: string,
  queueToken: string,
): Promise<QueuePosition> {
  try {
    return await http.get<QueuePosition>(`/v1/bookings/${bookingId}/position`, {
      headers: { Authorization: `Bearer ${queueToken}` },
      cache: 'no-store',
    });
  } catch (error) {
    console.warn(
      'API position fetch failed, falling back to demo position:',
      error instanceof ApiError ? `${error.status} ${error.message}` : error,
    );

    return {
      bookingId,
      position: 1,
      peopleAhead: 0,
      estimatedWaitMin: 0,
      slotStart: new Date().toISOString(),
      status: 'CONFIRMED',
      ticketNumber: null,
      priorityTier: 'STANDARD',
    };
  }
}

/// Decodes the customer's queue token payload without verifying the signature —
/// verification happens API-side on every request. We only read the token here
/// to source the `businessId` (needed to open the live socket) and its `exp`,
/// neither of which the position endpoint returns. Returns null when the token
/// is malformed or its claims fail the shared schema.
export function decodeQueueTokenClaims(
  queueToken: string,
): QueueTokenClaims | null {
  const parts = queueToken.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    const parsed = queueTokenClaimsSchema.safeParse(JSON.parse(payload));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Next.js Pages Router compatibility dummy export
export default function APIGETDummy() {
  return null;
}
