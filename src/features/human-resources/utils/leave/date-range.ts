import { createLoader, parseAsString } from 'nuqs/server';

import { isValidIsoDate } from '@/features/human-resources/utils/employees/tenure';

/** An inclusive range of yyyy-MM-dd dates. */
export type LeaveDateRange = { from: string; to: string };

export const leaveDateParams = {
  from: parseAsString,
  to: parseAsString,
};

export const loadLeaveDateParams = createLoader(leaveDateParams);

/** The calendar year that `today` (yyyy-MM-dd) falls in. */
export function getDefaultLeaveDateRange(today: string): LeaveDateRange {
  const year = today.slice(0, 4);

  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

/**
 * The range to list leave for. The URL values are used only when they make a
 * valid range; anything else falls back to the default.
 */
export function resolveLeaveDateRange(
  params: { from: string | null; to: string | null },
  fallback: LeaveDateRange,
): LeaveDateRange {
  const { from, to } = params;
  if (!from || !to || !isValidIsoDate(from) || !isValidIsoDate(to)) {
    return fallback;
  }

  return from <= to ? { from, to } : fallback;
}
