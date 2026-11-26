import { isValidIsoDate } from '@/features/human-resources/utils/employees/tenure';

const MS_PER_DAY = 86_400_000;
const SUNDAY = 0;
const SATURDAY = 6;
/** Monday to Friday count as 1, Saturday as 0.5 and Sunday as 0. */
const DAYS_PER_WEEK = 5.5;

function toUtc(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function weight(weekday: number) {
  if (weekday === SUNDAY) return 0;
  return weekday === SATURDAY ? 0.5 : 1;
}

/**
 * Leave days between two yyyy-MM-dd dates, both inclusive. A half day takes a
 * further 0.5 off the total. Returns 0 for incomplete or reversed ranges.
 */
export function countLeaveDays(start: string, end: string, halfDay = false) {
  if (!isValidIsoDate(start) || !isValidIsoDate(end) || end < start) return 0;

  const from = toUtc(start);
  const span =
    Math.round((toUtc(end).getTime() - from.getTime()) / MS_PER_DAY) + 1;

  let total = Math.floor(span / 7) * DAYS_PER_WEEK;
  for (let i = 0; i < span % 7; i++) {
    total += weight((from.getUTCDay() + i) % 7);
  }

  return Math.max(halfDay ? total - 0.5 : total, 0);
}

/** The day after the leave ends, skipping Sunday. Empty if `end` is unusable. */
export function suggestResumeDate(end: string) {
  if (!isValidIsoDate(end)) return '';

  const date = toUtc(end);
  date.setUTCDate(date.getUTCDate() + 1);
  if (date.getUTCDay() === SUNDAY) date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
}

/**
 * The half-day switch is not stored, so recover it from the saved total. A total
 * ending in .5 is not enough: a Saturday produces one too.
 */
export function wasHalfDay(start: string, end: string, daysTaken: number) {
  return countLeaveDays(start, end) - daysTaken === 0.5;
}
