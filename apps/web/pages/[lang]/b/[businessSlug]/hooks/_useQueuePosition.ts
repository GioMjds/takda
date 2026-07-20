'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { QueuePosition } from '@takda/shared';
import { refreshQueueToken as refreshApiToken } from '@/lib/api';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UseQueuePositionOptions {
  bookingId: string;
  businessId: string;
  initialToken: string;
  initialPosition: QueuePosition;
  refreshPhone: string;
}

export interface UseQueuePositionReturn {
  position: QueuePosition;
  totalActive: number | null;
  status: 'connecting' | 'live' | 'reconnecting' | 'expired' | 'error';
  onTapToRejoin: () => Promise<void>;
}

export function useQueuePosition(
  opts: UseQueuePositionOptions,
): UseQueuePositionReturn {
  const [position, setPosition] = useState<QueuePosition>(opts.initialPosition);
  const [totalActive, setTotalActive] = useState<number | null>(null);
  const [status, setStatus] = useState<
    'connecting' | 'live' | 'reconnecting' | 'expired' | 'error'
  >('connecting');
  const [token, setToken] = useState<string>(opts.initialToken);

  const socketRef = useRef<Socket | null>(null);

  const handleSilentRefresh = useCallback(async () => {
    try {
      const res = await refreshApiToken(opts.bookingId, opts.refreshPhone);
      setToken(res.queueToken);
      if (socketRef.current) {
        socketRef.current.auth = { token: res.queueToken };
        socketRef.current.disconnect().connect();
      }
    } catch {
      setStatus('expired');
    }
  }, [opts.bookingId, opts.refreshPhone]);

  useEffect(() => {
    const socket = io(`${WS_URL}/queue`, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('live');
    });

    socket.on('disconnect', () => {
      setStatus('reconnecting');
    });

    socket.on('queue.position', (data: QueuePosition) => {
      setPosition(data);
    });

    socket.on('queue.snapshot', (data: { totalActive: number }) => {
      setTotalActive(data.totalActive);
    });

    socket.on('exception', (err: { code?: string; message?: string }) => {
      if (err?.code === 'QUEUE_TOKEN_INVALID') {
        void handleSilentRefresh();
      } else {
        setStatus('error');
      }
    });

    socket.on('QUEUE_TOKEN_INVALID', () => {
      void handleSilentRefresh();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, handleSilentRefresh]);

  return {
    position,
    totalActive,
    status,
    onTapToRejoin: handleSilentRefresh,
  };
}

// Next.js Pages Router compatibility dummy export
export default function HookDummy() {
  return null;
}


