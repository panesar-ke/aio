import { describe, expect, it } from 'vitest';

import {
  countLeaveDays,
  suggestResumeDate,
  wasHalfDay,
} from '@/features/human-resources/utils/leave/days';

// 2026-11-23 is a Monday, 2026-11-28 a Saturday and 2026-11-29 a Sunday.
describe('countLeaveDays', () => {
  it('counts weekdays inclusively', () => {
    expect(countLeaveDays('2026-11-23', '2026-11-23')).toBe(1);
    expect(countLeaveDays('2026-11-23', '2026-11-27')).toBe(5);
  });

  it('counts Saturday as half a day', () => {
    expect(countLeaveDays('2026-11-28', '2026-11-28')).toBe(0.5);
    expect(countLeaveDays('2026-11-27', '2026-11-28')).toBe(1.5);
  });

  it('excludes Sunday', () => {
    expect(countLeaveDays('2026-11-29', '2026-11-29')).toBe(0);
    expect(countLeaveDays('2026-11-28', '2026-11-30')).toBe(1.5);
  });

  it('handles ranges spanning several weeks', () => {
    expect(countLeaveDays('2026-11-23', '2026-11-29')).toBe(5.5);
    expect(countLeaveDays('2026-11-26', '2026-12-09')).toBe(11);
  });

  it('takes half a day off when requested, never going below zero', () => {
    expect(countLeaveDays('2026-11-23', '2026-11-23', true)).toBe(0.5);
    expect(countLeaveDays('2026-11-23', '2026-11-25', true)).toBe(2.5);
    expect(countLeaveDays('2026-11-29', '2026-11-29', true)).toBe(0);
  });

  it('returns 0 for incomplete or reversed ranges', () => {
    expect(countLeaveDays('', '2026-11-23')).toBe(0);
    expect(countLeaveDays('2026-11-23', '')).toBe(0);
    expect(countLeaveDays('2026-11-25', '2026-11-23')).toBe(0);
  });
});

describe('suggestResumeDate', () => {
  it('suggests the next day', () => {
    expect(suggestResumeDate('2026-11-24')).toBe('2026-11-25');
    expect(suggestResumeDate('2026-11-27')).toBe('2026-11-28');
  });

  it('skips Sunday', () => {
    expect(suggestResumeDate('2026-11-28')).toBe('2026-11-30');
  });

  it('crosses year boundaries', () => {
    expect(suggestResumeDate('2026-12-31')).toBe('2027-01-01');
  });

  it('is empty without an end date', () => {
    expect(suggestResumeDate('')).toBe('');
  });
});

describe('wasHalfDay', () => {
  it('detects a saved half day', () => {
    expect(wasHalfDay('2026-11-23', '2026-11-25', 2.5)).toBe(true);
  });

  it('is not fooled by a Saturday', () => {
    expect(wasHalfDay('2026-11-27', '2026-11-28', 1.5)).toBe(false);
    expect(wasHalfDay('2026-11-27', '2026-11-28', 1)).toBe(true);
  });
});
