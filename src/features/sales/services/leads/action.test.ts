import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  update,
  insert,
  insertReturning,
  revalidateLeadsTag,
  revalidatePath,
  getLead,
} = vi.hoisted(() => {
  const updateWhere = vi.fn(async () => undefined);
  const set = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set }));

  const insertReturning = vi.fn(async () => [{ id: 'new-lead-id' }]);
  const values = vi.fn(() => ({ returning: insertReturning }));
  const insert = vi.fn(() => ({ values }));

  return {
    update,
    insert,
    updateWhere,
    insertReturning,
    revalidateLeadsTag: vi.fn(),
    revalidatePath: vi.fn(),
    getLead: vi.fn(),
  };
});

vi.mock('@/drizzle/db', () => ({
  default: {
    update,
    insert,
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

vi.mock('@/features/sales/utils/cache', () => ({
  revalidateLeadsTag,
}));

vi.mock('@/features/sales/services/leads/data', () => ({
  getLead,
}));

vi.mock('@/lib/permissions/guards', () => ({
  requireAnyPermission: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getCurrentUser: vi.fn(async () => ({ id: 'user-1' })),
}));

import { upsertLead } from '@/features/sales/services/leads/action';

const validLeadInput = {
  id: null,
  salutation: null,
  name: 'Jane Doe',
  company: 'Acme Limited',
  email: 'jane@example.com',
  phone: '0700000000',
  leadSource: 'referral',
  title: 'Director',
  description: 'Warm prospect',
  status: 'new' as const,
  kraPin: '123456789A',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('upsertLead', () => {
  it('revalidates the leads page after updating a lead', async () => {
    getLead.mockResolvedValueOnce({
      id: 'lead-1',
      salesRepId: 'user-1',
      state: 'lead',
    });

    const result = await upsertLead({
      ...validLeadInput,
      id: 'lead-1',
    });

    expect(result).toEqual({
      error: false,
      message: 'Lead updated successfully',
    });
    expect(revalidateLeadsTag).toHaveBeenCalledWith('lead-1');
    expect(revalidatePath).toHaveBeenCalledWith('/sales/leads');
  });

  it('revalidates the leads page after creating a lead', async () => {
    insertReturning.mockResolvedValueOnce([{ id: 'new-lead-id' }]);

    const result = await upsertLead(validLeadInput);

    expect(result).toEqual({
      error: false,
      message: 'Lead created successfully',
    });
    expect(revalidateLeadsTag).toHaveBeenCalledWith('new-lead-id');
    expect(revalidatePath).toHaveBeenCalledWith('/sales/leads');
  });
});
