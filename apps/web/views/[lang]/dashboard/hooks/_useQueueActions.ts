'use client';

import { useCallback, useState } from 'react';
import type { PriorityTier, SkipReason, WalkInInput } from '@takda/shared';
import {
  callNext,
  cancelBooking,
  completeBooking,
  recallBooking,
  registerWalkIn,
  setPriority,
  skipBooking,
  transferBooking,
} from '../api/POST';

export interface UseQueueActionsOptions {
  businessId: string;
  /// Called after any successful mutation so the caller can refetch the queue.
  onMutated?: () => void | Promise<void>;
}

export interface UseQueueActionsReturn {
  /// Id of the booking a per-row action is currently running against, or
  /// 'walk-in' / 'next' for the queue-level actions. Null when idle.
  pending: string | null;
  error: string | null;
  clearError: () => void;
  addWalkIn: (input: WalkInInput) => Promise<boolean>;
  next: () => Promise<boolean>;
  complete: (bookingId: string) => Promise<boolean>;
  recall: (bookingId: string) => Promise<boolean>;
  skip: (bookingId: string, reason?: SkipReason) => Promise<boolean>;
  cancel: (bookingId: string, reason?: string) => Promise<boolean>;
  prioritize: (bookingId: string, tier: PriorityTier) => Promise<boolean>;
  transfer: (
    bookingId: string,
    targetServiceId: string,
    slotStart?: string,
  ) => Promise<boolean>;
}

/// Wraps the owner queue mutations with a single-flight pending token and error
/// surface. Each action resolves to `true` on success / `false` on failure so
/// callers can branch (e.g. close a modal only on success). On success it
/// triggers `onMutated` to refetch the live queue immediately rather than
/// waiting for the next poll tick.
export function useQueueActions(
  opts: UseQueueActionsOptions,
): UseQueueActionsReturn {
  const { businessId, onMutated } = opts;
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (token: string, fn: () => Promise<unknown>): Promise<boolean> => {
      if (pending) return false;
      setPending(token);
      setError(null);
      try {
        await fn();
        await onMutated?.();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed');
        return false;
      } finally {
        setPending(null);
      }
    },
    [pending, onMutated],
  );

  return {
    pending,
    error,
    clearError: useCallback(() => setError(null), []),
    addWalkIn: (input) =>
      run('walk-in', () => registerWalkIn(businessId, input)),
    next: () => run('next', () => callNext(businessId)),
    complete: (bookingId) =>
      run(bookingId, () => completeBooking(businessId, bookingId)),
    recall: (bookingId) =>
      run(bookingId, () => recallBooking(businessId, bookingId)),
    skip: (bookingId, reason) =>
      run(bookingId, () => skipBooking(businessId, bookingId, reason)),
    cancel: (bookingId, reason) =>
      run(bookingId, () => cancelBooking(businessId, bookingId, reason)),
    prioritize: (bookingId, tier) =>
      run(bookingId, () => setPriority(businessId, bookingId, tier)),
    transfer: (bookingId, targetServiceId, slotStart) =>
      run(bookingId, () =>
        transferBooking(businessId, bookingId, targetServiceId, slotStart),
      ),
  };
}
