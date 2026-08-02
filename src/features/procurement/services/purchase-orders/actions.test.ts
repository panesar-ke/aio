import { describe, expect, it, vi } from 'vitest';

vi.mock('@/drizzle/db', () => ({
  default: {},
}));
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));
vi.mock('@/features/procurement/services/purchase-orders/data', () => ({
  getPurchaseOrder: vi.fn(),
}));
vi.mock('@/inngest/client', () => ({
  inngest: {},
}));
vi.mock('@/lib/axios', () => ({
  default: {},
}));
vi.mock('@/lib/permissions/guards', () => ({
  requireAnyPermission: vi.fn(),
}));
vi.mock('@/lib/session', () => ({
  getCurrentUser: vi.fn(),
}));

import { allocatePurchaseOrderNo } from '@/features/procurement/services/purchase-orders/actions';

const getQueryText = (query: { queryChunks: Array<unknown> }) =>
  query.queryChunks
    .map((chunk) =>
      typeof chunk === 'object' &&
      chunk !== null &&
      'value' in chunk &&
      Array.isArray(chunk.value)
        ? chunk.value.join('')
        : '',
    )
    .join('');

describe('allocatePurchaseOrderNo', () => {
  it('locks purchase-order number allocation before selecting the next number', async () => {
    const calls: Array<string> = [];
    const tx = {
      execute: vi.fn(async (query: { queryChunks: Array<unknown> }) => {
        const queryText = getQueryText(query);
        calls.push(queryText);

        if (queryText.includes('max')) {
          return { rows: [{ orderNo: 42 }] };
        }

        return { rows: [] };
      }),
    };

    await expect(allocatePurchaseOrderNo(tx)).resolves.toBe(42);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('pg_advisory_xact_lock');
    expect(calls[1]).toContain('max');
  });
});
