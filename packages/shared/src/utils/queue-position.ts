import { estimateWaitMin } from './wait-estimator';
import { PRIORITY_TIER_RANK, type PriorityTier } from '../schemas/booking';

type QueueStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'SERVING'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export interface QueuePositionInput {
  readonly businessId: string;
  readonly bookingId: string;
  readonly slotStart: string;
  readonly serviceDurationMin: number;
  readonly ticketNumber?: number | null;
  readonly priorityTier?: PriorityTier;
  readonly bookings: ReadonlyArray<{
    id: string;
    slotStart: string;
    createdAt: string;
    status: QueueStatus;
    priorityTier?: PriorityTier;
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
  readonly status: QueueStatus;
  readonly ticketNumber?: number | null;
  readonly priorityTier: PriorityTier;
}

/// Statuses that occupy a live slot in the queue. SERVING is included so the
/// head-of-queue still appears (as position 1) until it is COMPLETED.
const ACTIVE_STATUSES: ReadonlySet<QueueStatus> = new Set<QueueStatus>([
  'PENDING',
  'CONFIRMED',
  'SERVING',
]);

function tierRank(tier?: PriorityTier): number {
  if (!tier) return PRIORITY_TIER_RANK.STANDARD;
  return PRIORITY_TIER_RANK[tier] ?? PRIORITY_TIER_RANK.STANDARD;
}

/// Canonical queue ordering: priority tier (higher first), then slotStart,
/// then createdAt as a stable tie-breaker.
function compareQueueOrder(
  a: { slotStart: string; createdAt: string; priorityTier?: PriorityTier },
  b: { slotStart: string; createdAt: string; priorityTier?: PriorityTier },
): number {
  const rankDiff = tierRank(a.priorityTier) - tierRank(b.priorityTier);
  if (rankDiff !== 0) return rankDiff;

  const timeDiff =
    new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime();
  if (timeDiff !== 0) return timeDiff;

  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
    return isToday && ACTIVE_STATUSES.has(b.status as QueueStatus);
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
      return isToday && ACTIVE_STATUSES.has(b.status);
    })
    .sort(compareQueueOrder);

  const self = input.bookings.find((b) => b.id === input.bookingId);
  const selfTier = input.priorityTier ?? self?.priorityTier ?? 'STANDARD';
  const selfStatus = self?.status ?? 'CONFIRMED';

  const index = activeBookings.findIndex((b) => b.id === input.bookingId);
  if (index === -1) {
    return {
      bookingId: input.bookingId,
      position: 0,
      peopleAhead: 0,
      estimatedWaitMin: 0,
      slotStart: input.slotStart,
      status: selfStatus,
      ticketNumber: input.ticketNumber ?? null,
      priorityTier: selfTier,
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
    status: activeBookings[index].status,
    ticketNumber: input.ticketNumber ?? null,
    priorityTier: selfTier,
  };
}
