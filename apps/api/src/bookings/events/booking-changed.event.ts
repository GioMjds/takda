import type { BookingStatus } from '@takda/shared';

export class BookingChangedEvent {
  constructor(
    public readonly bookingId: string,
    public readonly businessId: string,
    public readonly status: BookingStatus,
    public readonly slotStart: string,
  ) {}
}
