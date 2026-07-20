import { estimateWaitMin } from './wait-estimator';

export interface QueuePositionInput {
  readonly businessId: string;
  readonly bookingId: string;
  readonly slotStart: string;
  readonly serviceDurationMin: number;
  readonly bookings: ReadonlyArray<{
    id: string;
    slotStart: string;
    createdAt: string;
    status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED';
  }>;
  readonly businessDayStartUtc: string;
  readonly businessDayEndUtc: string;
}

export interface QueuePositionResult {
  readonly bookingId: string;
  readonly position: number;
  readonly peopleAhead: number;
  readonly estimatedWaitMin: number;
  readonly slotStart: string;
}

export function countActiveForBusiness(
  bookings: ReadonlyArray<{ status: string; slotStart: string }>,
  businessDayStartUtc: string,
  businessDayEndUtc: string,
): number {
  const startMs = new Date(businessDayStartUtc).getTime();
  const endMs = new Date(businessDayEndUtc).getTime();

  return bookings.filter((b) => {
    const isToday =
      new Date(b.slotStart).getTime() >= startMs &&
      new Date(b.slotStart).getTime() <= endMs;
    const isActiveStatus = b.status === 'PENDING' || b.status === 'CONFIRMED';
    return isToday && isActiveStatus;
  }).length;
}

export function computeQueuePosition(
  input: QueuePositionInput,
): QueuePositionResult {
  const startMs = new Date(input.businessDayStartUtc).getTime();
  const endMs = new Date(input.businessDayEndUtc).getTime();

  const activeBookings = input.bookings
    .filter((b) => {
      const slotMs = new Date(b.slotStart).getTime();
      const isToday = slotMs >= startMs && slotMs <= endMs;
      const isActiveStatus = b.status === 'PENDING' || b.status === 'CONFIRMED';
      return isToday && isActiveStatus;
    })
    .sort((a, b) => {
      const timeDiff =
        new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime();
      if (timeDiff !== 0) return timeDiff;
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

  const index = activeBookings.findIndex((b) => b.id === input.bookingId);
  if (index === -1) {
    return {
      bookingId: input.bookingId,
      position: 0,
      peopleAhead: 0,
      estimatedWaitMin: 0,
      slotStart: input.slotStart,
    };
  }

  const position = index + 1;
  const peopleAhead = index;
  const estimatedWaitMin = estimateWaitMin(
    peopleAhead,
    input.serviceDurationMin,
  );

  return {
    bookingId: input.bookingId,
    position,
    peopleAhead,
    estimatedWaitMin,
    slotStart: input.slotStart,
  };
}
