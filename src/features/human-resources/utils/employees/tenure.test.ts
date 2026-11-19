import { describe, expect, it } from 'vitest';

import {
  formatTenure,
  getNairobiToday,
  isValidIsoDate,
  validateEffectiveDate,
} from './tenure';

describe('formatTenure', () => {
  it('formats years and months', () => {
    expect(formatTenure('2019-03-04', '2026-11-19')).toBe('7 yrs 8 mo');
  });

  it('uses singular year and omits zero months', () => {
    expect(formatTenure('2025-11-19', '2026-11-19')).toBe('1 yr');
  });

  it('drops a month when the day of month has not been reached', () => {
    expect(formatTenure('2026-09-25', '2026-11-19')).toBe('1 mo');
  });

  it('handles under a month and future start dates', () => {
    expect(formatTenure('2026-11-10', '2026-11-19')).toBe('Less than a month');
    expect(formatTenure('2027-01-01', '2026-11-19')).toBe('Not yet started');
  });
});

describe('getNairobiToday', () => {
  it('rolls over to the next day after 21:00 UTC (UTC+3)', () => {
    expect(getNairobiToday(new Date('2026-11-19T21:30:00Z'))).toBe('2026-11-20');
    expect(getNairobiToday(new Date('2026-11-19T20:30:00Z'))).toBe('2026-11-19');
  });
});

describe('validateEffectiveDate', () => {
  const today = '2026-11-19';

  it('accepts dates between joining and today, inclusive', () => {
    expect(validateEffectiveDate('2026-11-19', '2020-01-01', today)).toBeNull();
    expect(validateEffectiveDate('2020-01-01', '2020-01-01', today)).toBeNull();
  });

  it('rejects dates before the joining date', () => {
    expect(validateEffectiveDate('2019-12-31', '2020-01-01', today)).toMatch(/joining date/);
  });

  it('rejects future dates', () => {
    expect(validateEffectiveDate('2026-11-20', '2020-01-01', today)).toMatch(/future/);
  });

  it('skips the joining check when there is no joining date', () => {
    expect(validateEffectiveDate('1990-01-01', null, today)).toBeNull();
  });
});

describe('isValidIsoDate', () => {
  it('accepts real dates including leap days', () => {
    expect(isValidIsoDate('2026-11-19')).toBe(true);
    expect(isValidIsoDate('2024-02-29')).toBe(true);
    expect(isValidIsoDate('2026-12-31')).toBe(true);
  });

  it('rejects impossible dates and bad formats', () => {
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2025-02-29')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('2026-04-31')).toBe(false);
    expect(isValidIsoDate('2026-1-5')).toBe(false);
    expect(isValidIsoDate('')).toBe(false);
  });

  it('is enforced by validateEffectiveDate', () => {
    expect(validateEffectiveDate('2026-02-30', '2020-01-01', '2026-11-19')).toMatch(/valid date/);
  });
});
