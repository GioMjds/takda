import { describe, it, expect } from 'vitest';
import { canTransition, isTerminalStatus } from '../booking-state';

describe('booking-state machine', () => {
  it('allows the happy-path advance CONFIRMED -> SERVING -> COMPLETED', () => {
    expect(canTransition('CONFIRMED', 'SERVING')).toBe(true);
    expect(canTransition('SERVING', 'COMPLETED')).toBe(true);
  });

  it('allows PENDING/CONFIRMED to be cancelled', () => {
    expect(canTransition('PENDING', 'CANCELLED')).toBe(true);
    expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
  });

  it('allows a serving customer to be skipped (no-show)', () => {
    expect(canTransition('SERVING', 'NO_SHOW')).toBe(true);
  });

  it('rejects completing a booking that is not serving', () => {
    expect(canTransition('CONFIRMED', 'COMPLETED')).toBe(false);
    expect(canTransition('PENDING', 'COMPLETED')).toBe(false);
  });

  it('rejects any transition out of a hard-terminal state', () => {
    for (const terminal of ['COMPLETED', 'CANCELLED'] as const) {
      expect(canTransition(terminal, 'SERVING')).toBe(false);
      expect(canTransition(terminal, 'CONFIRMED')).toBe(false);
    }
  });

  it('allows a no-show to be re-queued (NO_SHOW is not hard-terminal)', () => {
    expect(canTransition('NO_SHOW', 'CONFIRMED')).toBe(true);
    expect(canTransition('NO_SHOW', 'SERVING')).toBe(false);
  });

  it('classifies hard-terminal statuses', () => {
    expect(isTerminalStatus('COMPLETED')).toBe(true);
    expect(isTerminalStatus('CANCELLED')).toBe(true);
    // NO_SHOW is recoverable (owner can re-queue), so it is not hard-terminal.
    expect(isTerminalStatus('NO_SHOW')).toBe(false);
    expect(isTerminalStatus('CONFIRMED')).toBe(false);
    expect(isTerminalStatus('SERVING')).toBe(false);
  });
});
