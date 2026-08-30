/**
 * Convert HH:MM time string to total minutes from midnight
 * e.g. "09:30" -> 570
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map((v) => parseInt(v, 10));
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges [startA, endA] and [startB, endB] overlap.
 * Adjacent intervals (e.g. 09:00-12:00 and 12:00-16:00) do NOT overlap.
 */
export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const minStartA = timeToMinutes(startA);
  const minEndA = timeToMinutes(endA);
  const minStartB = timeToMinutes(startB);
  const minEndB = timeToMinutes(endB);

  return minStartA < minEndB && minEndA > minStartB;
}

/**
 * Check if break time is completely inside working hours [startTime, endTime]
 */
export function isBreakInsideWorkingHours(
  startTime: string,
  endTime: string,
  breakStart?: string | null,
  breakEnd?: string | null,
): boolean {
  if (!breakStart && !breakEnd) return true;
  if (!breakStart || !breakEnd) return false;

  const minWorkStart = timeToMinutes(startTime);
  const minWorkEnd = timeToMinutes(endTime);
  const minBreakStart = timeToMinutes(breakStart);
  const minBreakEnd = timeToMinutes(breakEnd);

  // Break must be within working hours and breakEnd > breakStart
  return (
    minBreakStart >= minWorkStart &&
    minBreakEnd <= minWorkEnd &&
    minBreakEnd > minBreakStart
  );
}
