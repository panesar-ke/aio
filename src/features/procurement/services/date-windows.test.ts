import { describe, expect, it } from 'vitest';

import { getRollingThirtyDayWindow } from '@/features/procurement/services/date-windows';

describe('getRollingThirtyDayWindow', () => {
  it('returns deterministic current and comparison windows from the reference date', () => {
    expect(
      getRollingThirtyDayWindow(new Date('2026-07-27T12:00:00.000Z')),
    ).toEqual({
      today: '2026-07-27',
      last30DaysStart: '2026-06-27',
      previous30DaysStart: '2026-05-28',
      previous30DaysEnd: '2026-06-27',
    });
  });
});
