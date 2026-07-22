import type { BookingStatus } from '@takda/shared';

/// Emitted when the currently-serving (head-of-queue) booking changes for a
/// business — after call-next, complete, or skip. Drives the dashboard's
/// "Now serving" panel and the customer "you're next / now serving" pushes.
export class QueueHeadChangedEvent {
  constructor(
    public readonly businessId: string,
    public readonly bookingId: string | null,
    public readonly ticketNumber: number | null,
    public readonly status: BookingStatus | null,
  ) {}
}
