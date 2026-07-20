export function estimateWaitMin(
  peopleAhead: number,
  serviceDurationMin: number,
): number {
  return Math.max(0, peopleAhead) * Math.max(1, serviceDurationMin);
}
