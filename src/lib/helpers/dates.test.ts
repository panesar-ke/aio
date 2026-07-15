import { describe, expect, it } from 'vitest';

import {
  calculateAverageMonthlySpend,
  DASHBOARD_PERIOD_OPTIONS,
  DASHBOARD_PERIODS,
  DEFAULT_DASHBOARD_PERIOD,
  getDashboardComparisonPeriodRange,
  getDashboardPeriodRange,
  getFinancialYearStart,
  getMonthsElapsedInFinancialYear,
} from '@/lib/helpers/dates';

describe('getFinancialYearStart', () => {
  it('starts the financial year in the same calendar year for May–December', () => {
    expect(getFinancialYearStart(new Date(2025, 4, 1))).toBe(2025); // May 1
    expect(getFinancialYearStart(new Date(2025, 7, 15))).toBe(2025); // Aug 15
    expect(getFinancialYearStart(new Date(2025, 11, 31))).toBe(2025); // Dec 31
  });

  it('starts the financial year in the previous calendar year for January–April', () => {
    expect(getFinancialYearStart(new Date(2026, 0, 1))).toBe(2025); // Jan 1
    expect(getFinancialYearStart(new Date(2026, 2, 15))).toBe(2025); // Mar 15
    expect(getFinancialYearStart(new Date(2026, 3, 30))).toBe(2025); // Apr 30
  });
});

describe('getDashboardPeriodRange — quarter boundaries', () => {
  // Reference date sits in Q3 (Dec), so the active FY starts in 2025.
  const reference = new Date(2025, 11, 15);

  it('Q1 covers May 1 through July 31 (exclusive Aug 1)', () => {
    const range = getDashboardPeriodRange('q1', reference);
    expect(range.from).toEqual(new Date(2025, 4, 1));
    expect(range.toExclusive).toEqual(new Date(2025, 7, 1));
    expect(range.monthsInPeriod).toBe(3);
  });

  it('Q2 covers August 1 through October 31 (exclusive Nov 1)', () => {
    const range = getDashboardPeriodRange('q2', reference);
    expect(range.from).toEqual(new Date(2025, 7, 1));
    expect(range.toExclusive).toEqual(new Date(2025, 10, 1));
    expect(range.monthsInPeriod).toBe(3);
  });

  it('Q3 covers November 1 through January 31, crossing the calendar-year boundary (exclusive Feb 1 of Y+1)', () => {
    const range = getDashboardPeriodRange('q3', reference);
    expect(range.from).toEqual(new Date(2025, 10, 1));
    expect(range.toExclusive).toEqual(new Date(2026, 1, 1));
    expect(range.from.getFullYear()).toBe(2025);
    expect(range.toExclusive.getFullYear()).toBe(2026);
    expect(range.monthsInPeriod).toBe(3);
  });

  it('Q4 covers February 1 through April 30 of Y+1 (exclusive May 1 of Y+1)', () => {
    const range = getDashboardPeriodRange('q4', reference);
    expect(range.from).toEqual(new Date(2026, 1, 1));
    expect(range.toExclusive).toEqual(new Date(2026, 4, 1));
    expect(range.monthsInPeriod).toBe(3);
  });

  it('Previous Year covers May 1, Y-1 through April 30, Y (exclusive May 1, Y)', () => {
    const range = getDashboardPeriodRange('previous', reference);
    expect(range.from).toEqual(new Date(2024, 4, 1));
    expect(range.toExclusive).toEqual(new Date(2025, 4, 1));
    expect(range.monthsInPeriod).toBe(12);
    expect(range.financialYearStart).toBe(2024);
  });
});

describe('getDashboardPeriodRange — Current Year', () => {
  it('ends at the day after the reference date when inside the active financial year', () => {
    const reference = new Date(2025, 11, 15); // Dec 15, 2025
    const range = getDashboardPeriodRange('current', reference);
    expect(range.from).toEqual(new Date(2025, 4, 1));
    expect(range.toExclusive).toEqual(new Date(2025, 11, 16));
    expect(range.monthsInPeriod).toBe(8); // May..Dec
  });

  it('never exceeds April 30 of Y+1 (exclusive May 1, Y+1)', () => {
    const reference = new Date(2026, 3, 30); // Apr 30, 2026 (fyStartYear 2025)
    const range = getDashboardPeriodRange('current', reference);
    expect(range.toExclusive.getTime()).toBeLessThanOrEqual(
      new Date(2026, 4, 1).getTime(),
    );
  });

  it('handles a leap-year February reference date correctly', () => {
    const reference = new Date(2028, 1, 29); // Feb 29, 2028 (leap year)
    const range = getDashboardPeriodRange('current', reference);
    // fyStartYear for Feb 2028 is 2027 (Jan-Apr belongs to previous FY start)
    expect(range.from).toEqual(new Date(2027, 4, 1));
    expect(range.toExclusive).toEqual(new Date(2028, 2, 1)); // rolls over to Mar 1
    expect(range.monthsInPeriod).toBe(10); // May..Feb
  });
});

describe('getMonthsElapsedInFinancialYear', () => {
  it('counts May as month 1', () => {
    expect(getMonthsElapsedInFinancialYear(new Date(2025, 4, 1))).toBe(1);
  });

  it('counts December as month 8', () => {
    expect(getMonthsElapsedInFinancialYear(new Date(2025, 11, 1))).toBe(8);
  });

  it('counts January (next calendar year) as month 9', () => {
    expect(getMonthsElapsedInFinancialYear(new Date(2026, 0, 1))).toBe(9);
  });

  it('counts April (next calendar year) as month 12', () => {
    expect(getMonthsElapsedInFinancialYear(new Date(2026, 3, 30))).toBe(12);
  });
});

describe('getDashboardComparisonPeriodRange', () => {
  it('shifts the same period back exactly one financial year', () => {
    const reference = new Date(2025, 11, 15);
    const primary = getDashboardPeriodRange('q3', reference);
    const comparison = getDashboardComparisonPeriodRange('q3', reference);

    expect(comparison.from).toEqual(new Date(2024, 10, 1));
    expect(comparison.toExclusive).toEqual(new Date(2025, 1, 1));
    expect(comparison.financialYearStart).toBe(
      primary.financialYearStart - 1,
    );
  });

  it('keeps the same elapsed-month count for Current Year comparisons', () => {
    const reference = new Date(2025, 11, 15);
    const primary = getDashboardPeriodRange('current', reference);
    const comparison = getDashboardComparisonPeriodRange('current', reference);

    expect(comparison.monthsInPeriod).toBe(primary.monthsInPeriod);
    expect(comparison.from).toEqual(new Date(2024, 4, 1));
  });
});

describe('default dashboard period', () => {
  it('defaults to Current Year', () => {
    expect(DEFAULT_DASHBOARD_PERIOD).toBe('current');
    expect(DASHBOARD_PERIOD_OPTIONS[0]?.value).toBe('current');
  });

  it('produces a distinct range for every period option', () => {
    const reference = new Date(2025, 11, 15);
    const ranges = DASHBOARD_PERIODS.map(period =>
      getDashboardPeriodRange(period, reference),
    );
    const signatures = new Set(
      ranges.map(range => `${range.from.getTime()}-${range.toExclusive.getTime()}`),
    );
    expect(signatures.size).toBe(DASHBOARD_PERIODS.length);
  });
});

describe('calculateAverageMonthlySpend', () => {
  it('divides total spend by the months in a quarter', () => {
    expect(calculateAverageMonthlySpend(900, 3)).toBe(300);
  });

  it('divides total spend by 12 for Previous Year', () => {
    expect(calculateAverageMonthlySpend(2400, 12)).toBe(200);
  });

  it('divides by the elapsed months for a partial Current Year', () => {
    const reference = new Date(2025, 11, 15);
    const months = getMonthsElapsedInFinancialYear(reference); // 8
    expect(calculateAverageMonthlySpend(1600, months)).toBe(200);
  });

  it('returns zero when total spend is zero', () => {
    expect(calculateAverageMonthlySpend(0, 8)).toBe(0);
  });

  it('returns zero when the month count is zero', () => {
    expect(calculateAverageMonthlySpend(500, 0)).toBe(0);
  });
});
