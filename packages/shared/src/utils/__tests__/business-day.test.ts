import { describe, it, expect } from 'vitest';
import {
  businessDateString,
  businessDayBoundsUtc,
  timeZoneOffsetMs,
} from '../business-day';

describe('business-day helpers', () => {
  it('computes the local calendar date in Asia/Manila (UTC+8)', () => {
    // 2026-07-20 22:00 UTC is already 2026-07-21 06:00 in Manila.
    const instant = new Date('2026-07-20T22:00:00.000Z');
    expect(businessDateString(instant, 'Asia/Manila')).toBe('2026-07-21');
  });

  it('reports a +8h offset for Asia/Manila', () => {
    const instant = new Date('2026-07-20T12:00:00.000Z');
    expect(timeZoneOffsetMs(instant, 'Asia/Manila')).toBe(8 * 60 * 60 * 1000);
  });

  it('bounds the Manila business day in UTC', () => {
    // Any instant on 2026-07-21 (Manila) should map to the same local day
    // whose midnight is 2026-07-20T16:00Z and end is 2026-07-21T15:59:59.999Z.
    const instant = new Date('2026-07-21T06:00:00.000Z');
    const { startUtc, endUtc, dateStr } = businessDayBoundsUtc(
      instant,
      'Asia/Manila',
    );
    expect(dateStr).toBe('2026-07-21');
    expect(startUtc.toISOString()).toBe('2026-07-20T16:00:00.000Z');
    expect(endUtc.toISOString()).toBe('2026-07-21T15:59:59.999Z');
  });

  it('resets at the local-day boundary (two instants, different local days)', () => {
    const beforeMidnight = new Date('2026-07-20T15:59:00.000Z'); // 23:59 Manila 07-20
    const afterMidnight = new Date('2026-07-20T16:01:00.000Z'); // 00:01 Manila 07-21
    expect(businessDateString(beforeMidnight, 'Asia/Manila')).toBe(
      '2026-07-20',
    );
    expect(businessDateString(afterMidnight, 'Asia/Manila')).toBe('2026-07-21');
  });
});
