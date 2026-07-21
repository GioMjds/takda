import { describe, it, expect } from 'vitest';
import { computeQueuePosition, countActiveForBusiness } from '../queue-position';
import { estimateWaitMin } from '../wait-estimator';


describe('queue-position utils', () => {
  const baseInput = {
    businessId: 'biz_1',
    bookingId: 'b_2',
    slotStart: '2026-07-20T09:00:00.000Z',
    serviceDurationMin: 15,
    bookings: [
      {
        id: 'b_1',
        slotStart: '2026-07-20T08:30:00.000Z',
        createdAt: '2026-07-20T08:00:00.000Z',
        status: 'CONFIRMED' as const,
      },
      {
        id: 'b_2',
        slotStart: '2026-07-20T09:00:00.000Z',
        createdAt: '2026-07-20T08:05:00.000Z',
        status: 'PENDING' as const,
      },
      {
        id: 'b_3',
        slotStart: '2026-07-20T09:30:00.000Z',
        createdAt: '2026-07-20T08:10:00.000Z',
        status: 'CONFIRMED' as const,
      },
    ],
    businessDayStartUtc: '2026-07-20T00:00:00.000Z',
    businessDayEndUtc: '2026-07-20T23:59:59.999Z',
  };

  it('computes position, peopleAhead, and estimatedWaitMin correctly', () => {
    const res = computeQueuePosition(baseInput);
    expect(res.bookingId).toBe('b_2');
    expect(res.position).toBe(2);
    expect(res.peopleAhead).toBe(1);
    expect(res.estimatedWaitMin).toBe(15);
  });

  it('returns position 0 when booking is not in active list', () => {
    const res = computeQueuePosition({ ...baseInput, bookingId: 'b_99' });
    expect(res.position).toBe(0);
    expect(res.peopleAhead).toBe(0);
    expect(res.estimatedWaitMin).toBe(0);
  });

  it('counts active bookings for business day', () => {
    const activeCount = countActiveForBusiness(
      baseInput.bookings,
      baseInput.businessDayStartUtc,
      baseInput.businessDayEndUtc,
    );
    expect(activeCount).toBe(3);
  });

  it('calculates wait time estimation', () => {
    expect(estimateWaitMin(3, 10)).toBe(30);
  });

  it('sorts a higher priority tier ahead of an earlier slot', () => {
    // b_vip has a later slot but VIP tier; it should lead the queue.
    const res = computeQueuePosition({
      ...baseInput,
      bookingId: 'b_vip',
      priorityTier: 'VIP',
      bookings: [
        ...baseInput.bookings,
        {
          id: 'b_vip',
          slotStart: '2026-07-20T10:00:00.000Z',
          createdAt: '2026-07-20T08:20:00.000Z',
          status: 'CONFIRMED' as const,
          priorityTier: 'VIP' as const,
        },
      ],
    });
    expect(res.position).toBe(1);
    expect(res.peopleAhead).toBe(0);
    expect(res.priorityTier).toBe('VIP');
  });

  it('treats SERVING as an active head-of-queue slot', () => {
    const res = computeQueuePosition({
      ...baseInput,
      bookingId: 'b_1',
      bookings: [
        {
          id: 'b_1',
          slotStart: '2026-07-20T08:30:00.000Z',
          createdAt: '2026-07-20T08:00:00.000Z',
          status: 'SERVING' as const,
        },
        ...baseInput.bookings.slice(1),
      ],
    });
    expect(res.position).toBe(1);
    expect(res.status).toBe('SERVING');
  });

  it('carries ticketNumber through to the result', () => {
    const res = computeQueuePosition({ ...baseInput, ticketNumber: 42 });
    expect(res.ticketNumber).toBe(42);
  });
});
