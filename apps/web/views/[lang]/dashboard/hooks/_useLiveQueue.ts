'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LiveQueue } from '@takda/shared';
import { fetchLiveQueue } from '../api/GET';

export interface UseLiveQueueOptions {
  businessId: string;
  /// Poll interval in ms. Defaults to 5000. Set 0 to disable polling.
  intervalMs?: number;
  initial?: LiveQueue | null;
}

export type LiveQueueStatus = 'loading' | 'live' | 'error';

export interface UseLiveQueueReturn {
  queue: LiveQueue | null;
  status: LiveQueueStatus;
  error: string | null;
  /// Force an immediate refetch (used after an action mutates the queue).
  refresh: () => Promise<void>;
}

/// Polls the owner live-queue endpoint on an interval. REST polling (not
/// WebSockets) because the WS gateway only authenticates customer queue
/// tokens, not owner JWTs — the owner session lives in the httpOnly cookie
/// forwarded by the `/api/owner` BFF proxy. Pauses while the tab is hidden to
/// avoid needless load, and refetches immediately on re-focus.
export function useLiveQueue(opts: UseLiveQueueOptions): UseLiveQueueReturn {
  const { businessId, intervalMs = 5000, initial = null } = opts;

  const [queue, setQueue] = useState<LiveQueue | null>(initial);
  const [status, setStatus] = useState<LiveQueueStatus>(
    initial ? 'live' : 'loading',
  );
  const [error, setError] = useState<string | null>(null);

  // Guard against overlapping requests and state updates after unmount.
  const inFlight = useRef(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!businessId || inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await fetchLiveQueue(businessId);
      if (!mounted.current) return;
      setQueue(data);
      setStatus('live');
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      inFlight.current = false;
    }
  }, [businessId]);

  useEffect(() => {
    mounted.current = true;
    void refresh();

    if (intervalMs <= 0) {
      return () => {
        mounted.current = false;
      };
    }

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') void refresh();
      }, intervalMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted.current = false;
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh, intervalMs]);

  return { queue, status, error, refresh };
}
