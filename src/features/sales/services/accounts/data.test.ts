import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountTier } from '@/features/sales/utils/search-params';

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

// Mock db query builder
const mockHaving = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnValue({ having: mockHaving });
const mockGroupBy = vi.fn().mockReturnValue({
  having: mockHaving,
  orderBy: mockOrderBy,
});
const mockWhere = vi.fn().mockReturnValue({
  groupBy: mockGroupBy,
  orderBy: mockOrderBy,
});
const mockLeftJoin = vi
  .fn()
  .mockReturnValue({ where: mockWhere, groupBy: mockGroupBy });
const mockInnerJoin = vi.fn().mockReturnValue({
  leftJoin: mockLeftJoin,
  where: mockWhere,
  groupBy: mockGroupBy,
});
const mockFrom = vi.fn().mockReturnValue({
  innerJoin: mockInnerJoin,
  leftJoin: mockLeftJoin,
  where: mockWhere,
  groupBy: mockGroupBy,
});
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
const mockSaleAccountFindFirst = vi.fn().mockResolvedValue({
  id: 'account-1',
  name: 'Jane Doe',
  company: 'Acme Ltd',
  email: 'jane@acme.test',
  phone: '0712345678',
  kraPin: 'P012345678X',
  createdAt: '2023-11-06T00:00:00.000Z',
  status: 'new',
  state: 'account',
  user: { name: 'Sales User' },
});

vi.mock('@/drizzle/db', () => ({
  default: {
    select: (...args: Array<unknown>) => mockSelect(...args),
    query: {
      saleAccounts: {
        findFirst: (...args: Array<unknown>) => mockSaleAccountFindFirst(...args),
      },
    },
  },
}));

import {
  getAccountDetails,
  getAccounts,
} from '@/features/sales/services/accounts/data';

describe('getAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects id, company, name, phone, salesPerson, lastPurchaseDate and totalPurchaseValue', async () => {
    await getAccounts({
      search: '',
      tier: AccountTier.all,
      lastPurchase: null,
    });

    expect(mockSelect).toHaveBeenCalled();
    const selectArg = mockSelect.mock.calls[0][0];
    expect(selectArg).toHaveProperty('id');
    expect(selectArg).toHaveProperty('company');
    expect(selectArg).toHaveProperty('name');
    expect(selectArg).toHaveProperty('phone');
    expect(selectArg).toHaveProperty('salesPerson');
    expect(selectArg).toHaveProperty('lastPurchaseDate');
    expect(selectArg).toHaveProperty('totalPurchaseValue');
  });

  it('applies having filter when tier is high', async () => {
    await getAccounts({
      search: '',
      tier: AccountTier.high,
      lastPurchase: null,
    });

    expect(mockHaving).toHaveBeenCalled();
  });

  it('applies having filter when lastPurchase is 30', async () => {
    await getAccounts({
      search: '',
      tier: AccountTier.all,
      lastPurchase: '30',
    });

    expect(mockHaving).toHaveBeenCalled();
  });

  it('exposes account detail data through the account details query', async () => {
    await getAccountDetails('account-1');

    expect(mockSaleAccountFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.anything(),
      }),
    );
    expect(mockSelect).toHaveBeenCalled();
  });
});
