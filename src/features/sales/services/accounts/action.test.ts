import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  update,
  revalidateAccountsTag,
  revalidatePath,
  getAccount,
  requireAnyPermission,
  saleUser,
} = vi.hoisted(() => {
  const updateWhere = vi.fn(async () => undefined);
  const set = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set }));

  return {
    update,
    updateWhere,
    revalidateAccountsTag: vi.fn(),
    revalidatePath: vi.fn(),
    getAccount: vi.fn(),
    requireAnyPermission: vi.fn(),
    saleUser: vi.fn(),
  };
});

vi.mock('@/drizzle/db', () => ({
  default: {
    update,
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

vi.mock('@/features/sales/utils/cache', () => ({
  revalidateAccountsTag,
}));

vi.mock('@/features/sales/services/accounts/data', () => ({
  getAccount,
}));

vi.mock('@/lib/permissions/guards', () => ({
  requireAnyPermission,
}));

vi.mock('@/features/sales/utils/sale-helpers', () => ({
  saleUser,
}));

import { upsertAccount } from '@/features/sales/services/accounts/action';

const validAccountInput = {
  id: 'account-1',
  salutation: null,
  name: 'Jane Doe',
  company: 'Acme Limited',
  email: 'jane@example.com',
  phone: '0700000000',
  title: 'Director',
  description: 'Strategic account',
  kraPin: 'A123456789B',
};

beforeEach(() => {
  vi.clearAllMocks();
  saleUser.mockResolvedValue({ isSalesAdmin: true, userId: 'user-1' });
});

describe('upsertAccount', () => {
  it('revalidates account pages after updating an account', async () => {
    getAccount.mockResolvedValueOnce({
      id: 'account-1',
      salesRepId: 'user-1',
      state: 'account',
    });

    const result = await upsertAccount(validAccountInput);

    expect(result).toEqual({
      error: false,
      message: 'Account updated successfully',
    });
    expect(revalidateAccountsTag).toHaveBeenCalledWith('account-1');
    expect(revalidatePath).toHaveBeenCalledWith('/sales/accounts');
    expect(revalidatePath).toHaveBeenCalledWith('/sales/accounts/account-1/details');
  });
});
