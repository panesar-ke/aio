import { describe, expect, it } from 'vitest';

import {
  getDefaultLeaveDateRange,
  resolveLeaveDateRange,
} from '@/features/human-resources/utils/leave/date-range';

describe('getDefaultLeaveDateRange', () => {
  it('spans the whole calendar year', () => {
    expect(getDefaultLeaveDateRange('2026-11-26')).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    });
  });
});

describe('resolveLeaveDateRange', () => {
  const fallback = { from: '2026-01-01', to: '2026-12-31' };

  it('uses a chosen range, including one outside the current year', () => {
    const chosen = { from: '2025-03-01', to: '2027-02-28' };

    expect(resolveLeaveDateRange(chosen, fallback)).toEqual(chosen);
  });

  it('allows a single day', () => {
    const day = { from: '2026-04-02', to: '2026-04-02' };

    expect(resolveLeaveDateRange(day, fallback)).toEqual(day);
  });

  it.each([
    [null, null],
    ['2026-03-01', null],
    [null, '2026-03-01'],
    ['', ''],
    ['yesterday', '2026-03-01'],
    ['2026-02-30', '2026-03-01'],
    ['2026-03-02', '2026-03-01'],
  ])('falls back for from=%s to=%s', (from, to) => {
    expect(resolveLeaveDateRange({ from, to }, fallback)).toEqual(fallback);
  });
});
