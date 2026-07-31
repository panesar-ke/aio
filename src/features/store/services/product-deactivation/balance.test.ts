import { describe, expect, it, vi } from 'vitest';

import { sumProductBalanceAcrossStores } from '@/features/store/services/product-deactivation/balance';

describe('sumProductBalanceAcrossStores', () => {
  it('returns 0 when the product has never moved in any store', async () => {
    const listStoreIds = vi.fn().mockResolvedValue([]);
    const getBalance = vi.fn();

    const result = await sumProductBalanceAcrossStores(
      'product-1',
      new Date('2026-07-31'),
      { listStoreIds, getBalance },
    );

    expect(result).toBe(0);
    expect(getBalance).not.toHaveBeenCalled();
  });

  it('sums balances across every store the product has moved in', async () => {
    const listStoreIds = vi.fn().mockResolvedValue(['store-1', 'store-2']);
    const getBalance = vi
      .fn()
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(-2);

    const asOf = new Date('2026-07-31');
    const result = await sumProductBalanceAcrossStores('product-1', asOf, {
      listStoreIds,
      getBalance,
    });

    expect(result).toBe(3);
    expect(getBalance).toHaveBeenCalledWith('product-1', 'store-1', asOf);
    expect(getBalance).toHaveBeenCalledWith('product-1', 'store-2', asOf);
  });
});
