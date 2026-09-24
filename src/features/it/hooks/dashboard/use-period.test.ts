import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useQueryState } = vi.hoisted(() => ({
  useQueryState: vi.fn(),
}));

vi.mock('nuqs', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryState,
}));

import { useDashboardPeriod } from '@/features/it/hooks/dashboard/use-period';

describe('useDashboardPeriod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configures non-shallow updates so the server re-fetches the period data', () => {
    useDashboardPeriod();

    expect(useQueryState).toHaveBeenCalledWith(
      'period',
      expect.objectContaining({ shallow: false }),
    );
  });
});
