/** Today's calendar date (yyyy-MM-dd) in Nairobi, regardless of server timezone. */
export function getNairobiToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Human-readable length of service between two yyyy-MM-dd dates. */
export function formatTenure(joined: string, today: string) {
  const [jy, jm, jd] = joined.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);

  let months = (ty - jy) * 12 + (tm - jm);
  if (td < jd) months--;

  if (months < 0) return 'Not yet started';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0 && rest === 0) return 'Less than a month';

  return [
    years > 0 ? `${years} ${years === 1 ? 'yr' : 'yrs'}` : '',
    rest > 0 ? `${rest} mo` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** True for a real yyyy-MM-dd calendar date (rejects 2026-02-30, accepts leap days). */
export function isValidIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Returns an error message if `effectiveDate` is not a valid exit/reinstatement
 * date, or null when it is fine. All dates are yyyy-MM-dd.
 */
export function validateEffectiveDate(
  effectiveDate: string,
  joiningDate: string | null,
  today: string,
) {
  if (!isValidIsoDate(effectiveDate)) return 'Select a valid date.';
  if (effectiveDate > today) return 'The effective date cannot be in the future.';
  if (joiningDate && effectiveDate < joiningDate) {
    return 'The effective date cannot be before the employee’s joining date.';
  }
  return null;
}
