/// Timezone-aware business-day helpers. We avoid a date library (none is a
/// dependency) and lean on the built-in `Intl` APIs, which are available in
/// both Node and the browser. All business days are anchored to the
/// business's IANA timezone (e.g. "Asia/Manila").

/// Returns the local calendar date (YYYY-MM-DD) for `instant` in `timeZone`.
export function businessDateString(
  instant: Date,
  timeZone: string,
): string {
  // en-CA formats as YYYY-MM-DD, which is exactly what we want.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/// Returns the UTC instants bounding the business-local day that contains
/// `instant`. `startUtc` is inclusive (00:00:00.000 local) and `endUtc` is
/// inclusive of the last millisecond (23:59:59.999 local).
export function businessDayBoundsUtc(
  instant: Date,
  timeZone: string,
): { startUtc: Date; endUtc: Date; dateStr: string } {
  const dateStr = businessDateString(instant, timeZone);
  const offsetMs = timeZoneOffsetMs(instant, timeZone);

  // Local midnight expressed as UTC = local-midnight-as-if-UTC minus offset.
  const localMidnightAsUtc = new Date(`${dateStr}T00:00:00.000Z`).getTime();
  const startUtc = new Date(localMidnightAsUtc - offsetMs);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { startUtc, endUtc, dateStr };
}

/// Milliseconds that `timeZone` is ahead of UTC at `instant` (e.g. +8h for
/// Asia/Manila → 28_800_000). Handles DST by evaluating at the given instant.
export function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = dtf.formatToParts(instant);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === '24' ? '0' : map.hour),
    Number(map.minute),
    Number(map.second),
  );

  return asUtc - instant.getTime();
}

export interface WorkingHourRule {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export function isWithinBusinessHours(
  workingHours: WorkingHourRule[],
  instant: Date,
  timeZone: string,
): boolean {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(instant);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const currentDayOfWeek = dayMap[map.weekday];
  const rule = workingHours.find((h) => h.dayOfWeek === currentDayOfWeek);

  if (!rule || rule.isClosed) return false;

  const currentHHmm = `${map.hour.padStart(2, '0')}:${map.minute.padStart(2, '0')}`;
  return currentHHmm >= rule.openTime && currentHHmm < rule.closeTime;
}
