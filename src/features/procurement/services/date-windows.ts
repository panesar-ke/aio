import { subDays } from 'date-fns';

export interface RollingThirtyDayWindow {
  today: string;
  last30DaysStart: string;
  previous30DaysStart: string;
  previous30DaysEnd: string;
}

const toDateOnly = (value: Date) => value.toISOString().split('T')[0] as string;

export function getRollingThirtyDayWindow(
  referenceDate: Date,
): RollingThirtyDayWindow {
  const today = new Date(referenceDate);
  const last30DaysStart = subDays(today, 30);
  const previous30DaysStart = subDays(today, 60);
  const previous30DaysEnd = subDays(today, 30);

  return {
    today: toDateOnly(today),
    last30DaysStart: toDateOnly(last30DaysStart),
    previous30DaysStart: toDateOnly(previous30DaysStart),
    previous30DaysEnd: toDateOnly(previous30DaysEnd),
  };
}
