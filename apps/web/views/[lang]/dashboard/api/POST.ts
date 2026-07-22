'use client';

import type {
  Booking,
  PriorityTier,
  SkipReason,
  WalkInInput,
} from '@takda/shared';

/// Client-side owner queue actions (#16–#24). Every call goes through the
/// same-origin BFF proxy (`/api/owner/...`), which attaches the owner's JWT
/// from the httpOnly cookie server-side.

async function ownerPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/owner/${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (json && (json.message || json?.data?.message)) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return (json?.data ?? json) as T;
}

function base(businessId: string): string {
  return `v1/businesses/${encodeURIComponent(businessId)}/queue`;
}

/// #16 — Register a walk-in customer into today's queue.
export function registerWalkIn(
  businessId: string,
  input: WalkInInput,
): Promise<Booking> {
  return ownerPost<Booking>(`${base(businessId)}/walk-ins`, input);
}

/// #17 — Call the next waiting customer to the counter.
export function callNext(
  businessId: string,
): Promise<{ booking: Booking | null }> {
  return ownerPost<{ booking: Booking | null }>(`${base(businessId)}/next`);
}

/// #24 — Mark the currently-serving customer as completed.
export function completeBooking(
  businessId: string,
  bookingId: string,
): Promise<Booking> {
  return ownerPost<Booking>(
    `${base(businessId)}/${encodeURIComponent(bookingId)}/complete`,
  );
}

/// #19 — Re-announce the currently-serving customer.
export function recallBooking(
  businessId: string,
  bookingId: string,
): Promise<Booking> {
  return ownerPost<Booking>(
    `${base(businessId)}/${encodeURIComponent(bookingId)}/recall`,
  );
}

/// #20 — Skip a customer (mark no-show) and advance the queue.
export function skipBooking(
  businessId: string,
  bookingId: string,
  reason?: SkipReason,
): Promise<Booking> {
  return ownerPost<Booking>(
    `${base(businessId)}/${encodeURIComponent(bookingId)}/skip`,
    { reason: reason ?? 'no_show' },
  );
}

/// #21 — Owner cancel-on-behalf of a customer.
export function cancelBooking(
  businessId: string,
  bookingId: string,
  reason?: string,
): Promise<Booking> {
  return ownerPost<Booking>(
    `${base(businessId)}/${encodeURIComponent(bookingId)}/cancel`,
    { reason: reason ?? null },
  );
}

/// #18 — Set a customer's priority tier.
export function setPriority(
  businessId: string,
  bookingId: string,
  priorityTier: PriorityTier,
): Promise<Booking> {
  return ownerPost<Booking>(
    `${base(businessId)}/${encodeURIComponent(bookingId)}/priority`,
    { priorityTier },
  );
}

/// #22 — Transfer a booking to another service.
export function transferBooking(
  businessId: string,
  bookingId: string,
  targetServiceId: string,
  slotStart?: string,
): Promise<Booking> {
  return ownerPost<Booking>(
    `${base(businessId)}/${encodeURIComponent(bookingId)}/transfer`,
    { targetServiceId, slotStart },
  );
}
