import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  execute,
  findFirst,
  insert,
  transaction,
  getEligibleCandidates,
  revalidateProductDeactivation,
  sumProductBalanceAcrossStores,
  update,
} = vi.hoisted(() => {
  const execute = vi.fn();
  const findFirst = vi.fn();
  const insert = vi.fn();
  const transaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({
      execute,
      insert,
      query: {
        productDeactivationBatches: {
          findFirst,
        },
      },
      update,
    }),
  );
  const getEligibleCandidates = vi.fn();
  const revalidateProductDeactivation = vi.fn();
  const sumProductBalanceAcrossStores = vi.fn();
  const update = vi.fn();

  return {
    execute,
    findFirst,
    insert,
    transaction,
    getEligibleCandidates,
    revalidateProductDeactivation,
    sumProductBalanceAcrossStores,
    update,
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
  sumProductBalanceAcrossStores,
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

import {
  deactivateAndLogStaleProducts,
  deactivateNextStaleProductsChunk,
} from '@/features/store/services/product-deactivation/actions';

describe('deactivateAndLogStaleProducts', () => {
  beforeEach(() => {
    execute.mockReset();
    findFirst.mockReset();
    insert.mockReset();
    transaction.mockClear();
    getEligibleCandidates.mockReset();
    revalidateProductDeactivation.mockReset();
    sumProductBalanceAcrossStores.mockReset();
    update.mockReset();
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

  it('processes one bounded chunk and records progress in the batch', async () => {
    let insertCallCount = 0;
    let updateCallCount = 0;

    findFirst.mockResolvedValueOnce(null);
    getEligibleCandidates.mockResolvedValueOnce([
      {
        productId: 'product-1',
        createdOn: null,
        lastUsedDate: new Date('2024-01-01'),
        lastUsedSource: 'stock_movements',
      },
      {
        productId: 'product-2',
        createdOn: null,
        lastUsedDate: new Date('2024-01-02'),
        lastUsedSource: 'mrq',
      },
      {
        productId: 'product-3',
        createdOn: null,
        lastUsedDate: new Date('2024-01-03'),
        lastUsedSource: 'orders',
      },
    ]);
    sumProductBalanceAcrossStores.mockResolvedValue(0);

    insert.mockImplementation(() => ({
      values: vi.fn(() => {
        insertCallCount += 1;

        if (insertCallCount === 1) {
          return {
            returning: vi.fn().mockResolvedValue([{ id: 'batch-new' }]),
          };
        }

        return Promise.resolve();
      }),
    }));

    update.mockImplementation(() => {
      updateCallCount += 1;

      if (updateCallCount === 1) {
        return {
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        };
      }

      return {
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ totalCount: 2 }]),
          })),
        })),
      };
    });

    const result = await deactivateNextStaleProductsChunk(
      2,
      new Date('2026-08-04T00:00:00.000Z'),
      '11111111-1111-1111-1111-111111111111',
    );

    expect(result).toEqual({
      batchId: 'batch-new',
      processedCount: 2,
      totalCount: 2,
    });
    expect(sumProductBalanceAcrossStores).toHaveBeenCalledTimes(2);
    expect(revalidateProductDeactivation).toHaveBeenCalledWith('batch-new');
  });
});
