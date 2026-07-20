export class BookingCreatedEvent {
  constructor(
    public readonly bookingId: string,
    public readonly businessId: string,
    public readonly serviceId: string,
    public readonly slotStart: string,
  ) {}
}
