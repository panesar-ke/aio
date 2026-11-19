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

/**
 * Returns an error message if `effectiveDate` is not a valid exit/reinstatement
 * date, or null when it is fine. All dates are yyyy-MM-dd.
 */
export function validateEffectiveDate(
  effectiveDate: string,
  joiningDate: string | null,
  today: string,
) {
  if (effectiveDate > today) return 'The effective date cannot be in the future.';
  if (joiningDate && effectiveDate < joiningDate) {
    return 'The effective date cannot be before the employee’s joining date.';
  }
  return null;
}
