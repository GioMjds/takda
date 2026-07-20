import React from 'react';
import { io } from 'socket.io-client';
import { refreshQueueToken } from '@/lib/api';
import { useQueuePosition, UseQueuePositionOptions } from '@/pages/[lang]/b/[businessSlug]/hooks/_useQueuePosition';
import type { QueuePosition } from '@takda/shared';

jest.mock('socket.io-client');
jest.mock('@/lib/api');

class MockSocket {
  handlers: Record<string, Function[]> = {};
  auth: { token: string } = { token: '' };
  connected = false;

  constructor(authOpts?: { token: string }) {
    if (authOpts?.token) {
      this.auth = authOpts;
    }
  }

  on(event: string, fn: Function) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(fn);
    return this;
  }

  off(event: string, fn?: Function) {
    if (!fn) {
      delete this.handlers[event];
    } else if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter((h) => h !== fn);
    }
    return this;
  }

  emit(event: string, ...args: any[]) {
    return this;
  }

  trigger(event: string, ...args: any[]) {
    const callbacks = this.handlers[event] || [];
    callbacks.forEach((cb) => cb(...args));
  }

  disconnect() {
    this.connected = false;
    this.trigger('disconnect');
    return this;
  }

  connect() {
    this.connected = true;
    this.trigger('connect');
    return this;
  }
}

describe('useQueuePosition hook unit tests', () => {
  let mockSocket: MockSocket;
  const initialPos: QueuePosition = {
    bookingId: 'b_123',
    position: 3,
    peopleAhead: 2,
    estimatedWaitMin: 30,
    slotStart: '2026-07-20T09:00:00.000Z',
    status: 'CONFIRMED',
  };

  const defaultOpts: UseQueuePositionOptions = {
    bookingId: 'b_123',
    businessId: 'biz_456',
    initialToken: 'initial_token_abc',
    initialPosition: initialPos,
    refreshPhone: '+639171234567',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = new MockSocket({ token: defaultOpts.initialToken });
    (io as jest.Mock).mockImplementation((_url: string, opts: any) => {
      if (opts?.auth?.token) {
        mockSocket.auth = opts.auth;
      }
      return mockSocket;
    });
  });

  function runHook(opts: UseQueuePositionOptions = defaultOpts) {
    let position = opts.initialPosition;
    let totalActive: number | null = null;
    let status: 'connecting' | 'live' | 'reconnecting' | 'expired' | 'error' = 'connecting';
    let token = opts.initialToken;

    const stateMap = new Map<any, any>();

    jest.spyOn(React, 'useState').mockImplementation(((initial: any) => {
      if (!stateMap.has(initial)) {
        stateMap.set(initial, initial);
      }
      const val = stateMap.get(initial);
      const setter = (nextVal: any) => {
        const resolved = typeof nextVal === 'function' ? nextVal(val) : nextVal;
        stateMap.set(initial, resolved);
        if (initial === opts.initialPosition) position = resolved;
        if (initial === null) totalActive = resolved;
        if (initial === 'connecting') status = resolved;
        if (initial === opts.initialToken) token = resolved;
      };
      return [val, setter];
    }) as any);

    const socketRef = { current: null as any };
    jest.spyOn(React, 'useRef').mockReturnValue(socketRef);

    jest.spyOn(React, 'useCallback').mockImplementation(((fn: any) => fn) as any);

    let effectCleanup: (() => void) | void;
    jest.spyOn(React, 'useEffect').mockImplementation(((effect: any) => {
      effectCleanup = effect();
    }) as any);

    const hookReturn = useQueuePosition(opts);

    return {
      get current() {
        return {
          position: stateMap.get(opts.initialPosition) ?? position,
          totalActive: stateMap.get(null) ?? totalActive,
          status: stateMap.get('connecting') ?? status,
          token: stateMap.get(opts.initialToken) ?? token,
          onTapToRejoin: hookReturn.onTapToRejoin,
        };
      },
      cleanup: () => {
        if (effectCleanup) effectCleanup();
      },
      socket: mockSocket,
    };
  }

  it('initializes socket connection and hook state', () => {
    const hook = runHook();

    expect(io).toHaveBeenCalledWith(
      expect.stringContaining('/queue'),
      expect.objectContaining({
        auth: { token: 'initial_token_abc' },
        transports: ['websocket'],
      }),
    );

    expect(hook.current.position).toEqual(initialPos);
    expect(hook.current.totalActive).toBeNull();
    expect(hook.current.status).toBe('connecting');
  });

  it('handles connect event setting status to live', () => {
    const hook = runHook();

    hook.socket.trigger('connect');
    expect(hook.current.status).toBe('live');
  });

  it('handles disconnect event setting status to reconnecting', () => {
    const hook = runHook();

    hook.socket.trigger('disconnect');
    expect(hook.current.status).toBe('reconnecting');
  });

  it('handles queue.position event updating position state', () => {
    const hook = runHook();

    const updatedPos: QueuePosition = {
      ...initialPos,
      position: 1,
      peopleAhead: 0,
      estimatedWaitMin: 0,
    };

    hook.socket.trigger('queue.position', updatedPos);
    expect(hook.current.position).toEqual(updatedPos);
  });

  it('handles queue.snapshot event updating totalActive state', () => {
    const hook = runHook();

    hook.socket.trigger('queue.snapshot', { totalActive: 15 });
    expect(hook.current.totalActive).toBe(15);
  });

  it('triggers silent token refresh on QUEUE_TOKEN_INVALID exception and reconnects socket', async () => {
    (refreshQueueToken as jest.Mock).mockResolvedValueOnce({
      queueToken: 'new_token_456',
      queueTokenExpiresAt: '2026-07-21T09:00:00.000Z',
    });

    const disconnectSpy = jest.spyOn(mockSocket, 'disconnect');
    const connectSpy = jest.spyOn(mockSocket, 'connect');

    const hook = runHook();

    hook.socket.trigger('exception', { code: 'QUEUE_TOKEN_INVALID' });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(refreshQueueToken).toHaveBeenCalledWith('b_123', '+639171234567');
    expect(hook.current.token).toBe('new_token_456');
    expect(mockSocket.auth.token).toBe('new_token_456');
    expect(disconnectSpy).toHaveBeenCalled();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('sets status to error on non-QUEUE_TOKEN_INVALID exception', () => {
    const hook = runHook();

    hook.socket.trigger('exception', { code: 'INTERNAL_ERROR' });
    expect(hook.current.status).toBe('error');
  });

  it('sets status to expired when silent token refresh fails', async () => {
    (refreshQueueToken as jest.Mock).mockRejectedValueOnce(
      new Error('Token refresh failed'),
    );

    const hook = runHook();

    hook.socket.trigger('exception', { code: 'QUEUE_TOKEN_INVALID' });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(hook.current.status).toBe('expired');
  });

  it('allows manual trigger of silent refresh via onTapToRejoin', async () => {
    (refreshQueueToken as jest.Mock).mockResolvedValueOnce({
      queueToken: 'rejoined_token_789',
      queueTokenExpiresAt: '2026-07-21T09:00:00.000Z',
    });

    const hook = runHook();

    await hook.current.onTapToRejoin();

    expect(refreshQueueToken).toHaveBeenCalledWith('b_123', '+639171234567');
    expect(hook.current.token).toBe('rejoined_token_789');
  });

  it('disconnects socket on effect cleanup (unmount)', () => {
    const disconnectSpy = jest.spyOn(mockSocket, 'disconnect');
    const hook = runHook();

    hook.cleanup();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});
