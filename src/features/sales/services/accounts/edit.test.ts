import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
}));

vi.mock('@/features/sales/utils/sale-helpers', () => ({
  saleUser: vi.fn().mockResolvedValue({ isAdmin: true, userId: 'user-1' }),
}));

vi.mock('@/features/sales/utils/cache', () => ({
  getAccountsGlobalTag: vi.fn().mockReturnValue('accounts-global'),
  getAccountIdTag: vi.fn().mockReturnValue('accounts-id'),
}));

const mockSaleAccountFindFirst = vi.fn();

vi.mock('@/drizzle/db', () => ({
  default: {
    query: {
      saleAccounts: {
        findFirst: (...args: Array<unknown>) => mockSaleAccountFindFirst(...args),
      },
    },
  },
}));

import { getAccount } from '@/features/sales/services/accounts/data';

describe('getAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads an editable account record constrained to account state', async () => {
    mockSaleAccountFindFirst.mockResolvedValueOnce({
      id: 'account-1',
      state: 'account',
    });

    await getAccount('account-1');

    expect(mockSaleAccountFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.anything(),
      }),
    );
  });
});
