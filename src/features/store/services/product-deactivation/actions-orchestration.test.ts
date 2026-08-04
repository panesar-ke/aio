import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  execute,
  findFirst,
  transaction,
  getEligibleCandidates,
  revalidateProductDeactivation,
} = vi.hoisted(() => {
  const execute = vi.fn();
  const findFirst = vi.fn();
  const transaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({
      execute,
      query: {
        productDeactivationBatches: {
          findFirst,
        },
      },
    }),
  );
  const getEligibleCandidates = vi.fn();
  const revalidateProductDeactivation = vi.fn();

  return {
    execute,
    findFirst,
    transaction,
    getEligibleCandidates,
    revalidateProductDeactivation,
  };
});

vi.mock('@/drizzle/db', () => ({
  default: {
    transaction,
  },
}));

vi.mock('@/features/store/services/product-deactivation/eligibility', () => ({
  getEligibleCandidates,
}));

vi.mock('@/features/store/services/product-deactivation/balance', () => ({
  sumProductBalanceAcrossStores: vi.fn(),
}));

vi.mock('@/features/store/utils/cache', () => ({
  revalidateProductDeactivation,
}));

vi.mock('@/features/global/services/actions', () => ({
  createNotification: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getCurrentUserOrNull: vi.fn(),
}));

vi.mock('@/lib/permissions/service', () => ({
  ADMIN_USER_TYPES: new Set(),
}));

import { deactivateAndLogStaleProducts } from '@/features/store/services/product-deactivation/actions';

describe('deactivateAndLogStaleProducts', () => {
  beforeEach(() => {
    execute.mockReset();
    findFirst.mockReset();
    transaction.mockClear();
    getEligibleCandidates.mockReset();
    revalidateProductDeactivation.mockReset();
  });

  it('recovers an existing batch for the same trigger request id before rescanning candidates', async () => {
    findFirst.mockResolvedValueOnce({
      id: 'batch-1',
      totalCount: 3,
    });

    const result = await deactivateAndLogStaleProducts(
      new Date('2026-08-04T00:00:00.000Z'),
      '11111111-1111-1111-1111-111111111111',
    );

    expect(result).toEqual({
      batchId: 'batch-1',
      totalCount: 3,
    });
    expect(getEligibleCandidates).not.toHaveBeenCalled();
    expect(revalidateProductDeactivation).toHaveBeenCalledWith('batch-1');
  });
});
