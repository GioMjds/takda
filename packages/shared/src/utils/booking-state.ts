import type { BookingStatus } from '../schemas/booking';

/// Allowed booking status transitions for the queue lifecycle.
///
///   PENDING ─┬─▶ CONFIRMED ─┬─▶ SERVING ─┬─▶ COMPLETED   (terminal)
///            │              │            ├─▶ NO_SHOW      (skip / recall expiry)
///            │              │            └─▶ CONFIRMED    (re-queue after skip)
///            │              ├─▶ NO_SHOW
///            │              └─▶ CANCELLED (terminal)
///            ├─▶ CONFIRMED
///            └─▶ CANCELLED
///
/// CHECKED_IN is retained from the pre-queue schema and treated as equivalent
/// to CONFIRMED for transition purposes (it can move to SERVING/CANCELLED).
const TRANSITIONS: Record<BookingStatus, ReadonlySet<BookingStatus>> = {
  PENDING: new Set(['CONFIRMED', 'CHECKED_IN', 'SERVING', 'NO_SHOW', 'CANCELLED']),
  CONFIRMED: new Set(['CHECKED_IN', 'SERVING', 'NO_SHOW', 'CANCELLED']),
  CHECKED_IN: new Set(['SERVING', 'NO_SHOW', 'CANCELLED']),
  SERVING: new Set(['COMPLETED', 'NO_SHOW', 'CONFIRMED', 'CANCELLED']),
  COMPLETED: new Set([]),
  NO_SHOW: new Set(['CONFIRMED']),
  CANCELLED: new Set([]),
};

export const TERMINAL_BOOKING_STATUSES: ReadonlySet<BookingStatus> = new Set([
  'COMPLETED',
  'CANCELLED',
]);

export function isTerminalStatus(status: BookingStatus): boolean {
  return TERMINAL_BOOKING_STATUSES.has(status);
}

export function canTransition(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return TRANSITIONS[from]?.has(to) ?? false;
}
