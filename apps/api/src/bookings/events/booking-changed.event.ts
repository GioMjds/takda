export class BookingChangedEvent {
  constructor(
    public readonly bookingId: string,
    public readonly businessId: string,
    public readonly status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED',
    public readonly slotStart: string,
  ) {}
}
