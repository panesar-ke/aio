import { beforeEach, describe, expect, it, vi } from 'vitest';

const { throttle, useQueryStates } = vi.hoisted(() => ({
  throttle: vi.fn((timeMs: number) => ({ method: 'throttle' as const, timeMs })),
  useQueryStates: vi.fn(),
}));

vi.mock('nuqs', () => ({
  throttle,
  useQueryStates,
}));

import { useLeadsFilters } from '@/features/sales/hooks/leads/use-filters';
import {
  leadSearchParams,
  LeadStatus,
} from '@/features/sales/utils/search-params';

describe('useLeadsFilters', () => {
  const setFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useQueryStates.mockReturnValue([
      { search: '', status: LeadStatus.all },
      setFilters,
    ]);
  });

  it('configures non-shallow query updates with throttled URL writes', () => {
    useLeadsFilters();

    expect(throttle).toHaveBeenCalledWith(120);
    expect(useQueryStates).toHaveBeenCalledWith(leadSearchParams, {
      shallow: false,
      limitUrlUpdates: { method: 'throttle', timeMs: 120 },
    });
  });

  it('preserves the search and status handlers', () => {
    const { onHandleSearch, onLeadStatusChange } = useLeadsFilters();

    onHandleSearch('acme');
    onLeadStatusChange(LeadStatus.qualified);

    expect(setFilters).toHaveBeenNthCalledWith(1, { search: 'acme' });
    expect(setFilters).toHaveBeenNthCalledWith(2, {
      status: LeadStatus.qualified,
    });
  });
});
