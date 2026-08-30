import { isTimeOverlapping, timeToMinutes } from '../schedules/schedule.fn';

export const MIN_ADVANCE_HOURS = 1;

/**
 * Convert minutes from midnight to HH:MM string
 * e.g. 570 -> "09:30"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Add minutes to HH:MM time string
 * e.g. ("09:00", 30) -> "09:30"
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const mins = timeToMinutes(time) + minutesToAdd;
  return minutesToTime(mins);
}

/**
 * Get day of week (0=Sunday ... 6=Saturday) from YYYY-MM-DD string
 * Parses cleanly in UTC to prevent timezone skew on the date itself
 */
export function getDayOfWeekFromDate(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month is 0-indexed in JS Date
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCDay();
}

/**
 * Get current date string in Asia/Bangkok timezone (YYYY-MM-DD)
 */
export function getCurrentBangkokDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Get current time string in Asia/Bangkok timezone (HH:MM)
 */
export function getCurrentBangkokTime(): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
}

/**
 * Check if candidate slot overlaps with break time
 */
export function isSlotOverlappingBreak(
  slotStart: string,
  slotEnd: string,
  breakStart?: string | null,
  breakEnd?: string | null,
): boolean {
  if (!breakStart || !breakEnd) return false;
  return isTimeOverlapping(slotStart, slotEnd, breakStart, breakEnd);
}

/**
 * Check if candidate slot overlaps with any active booking
 */
export function isSlotOverlappingBookings(
  slotStart: string,
  slotEnd: string,
  activeAppointments: Array<{ start_time: string; end_time: string }>,
): boolean {
  return activeAppointments.some((appt) =>
    isTimeOverlapping(slotStart, slotEnd, appt.start_time, appt.end_time),
  );
}

/**
 * Check if a date/time is in the past or violates minimum advance hours
 */
export function isDateTimeInPastOrTooLate(
  dateStr: string,
  startTime: string,
  minAdvanceHours: number = MIN_ADVANCE_HOURS,
  currentDate?: string,
  currentTime?: string,
): { inPastDate: boolean; tooLate: boolean } {
  const today = currentDate ?? getCurrentBangkokDate();
  const nowTime = currentTime ?? getCurrentBangkokTime();

  if (dateStr < today) {
    return { inPastDate: true, tooLate: true };
  }

  if (dateStr === today) {
    const minAdvanceMinutes = minAdvanceHours * 60;
    const currentTotalMinutes = timeToMinutes(nowTime);
    const slotTotalMinutes = timeToMinutes(startTime);

    if (slotTotalMinutes < currentTotalMinutes + minAdvanceMinutes) {
      return { inPastDate: false, tooLate: true };
    }
  }

  return { inPastDate: false, tooLate: false };
}

/**
 * Generate candidate slots stepping by durationMinutes
 */
export function generateCandidateSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  breakStart?: string | null,
  breakEnd?: string | null,
): Array<{ start_time: string; end_time: string }> {
  const slots: Array<{ start_time: string; end_time: string }> = [];
  const endMinutes = timeToMinutes(endTime);
  let currentMinutes = timeToMinutes(startTime);

  while (currentMinutes + durationMinutes <= endMinutes) {
    const slotStart = minutesToTime(currentMinutes);
    const slotEnd = minutesToTime(currentMinutes + durationMinutes);

    // Skip if slot overlaps break time
    if (!isSlotOverlappingBreak(slotStart, slotEnd, breakStart, breakEnd)) {
      slots.push({ start_time: slotStart, end_time: slotEnd });
    }

    currentMinutes += durationMinutes;
  }

  return slots;
}
