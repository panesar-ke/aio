import { describe, expect, it, vi } from 'vitest';

vi.mock('@/drizzle/db', () => ({
  default: {},
}));
vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
}));
vi.mock('@/features/sales/utils/sale-helpers', () => ({
  saleUser: vi.fn(),
}));

import { getSaleOrderNo } from '@/features/sales/services/orders/data';

const getQueryText = (query: any): string => {
  if (!query) return '';
  if (typeof query === 'string') return query;
  if (query.name) return query.name;
  if (query.value) {
    if (Array.isArray(query.value)) return query.value.join('');
    if (typeof query.value === 'string') return query.value;
    if (typeof query.value === 'object') return getQueryText(query.value);
  }
  if (Array.isArray(query.queryChunks)) {
    return query.queryChunks.map(getQueryText).join(' ');
  }
  return '';
};

describe('getSaleOrderNo', () => {
  it('locks sale order number allocation before selecting the next number', async () => {
    const calls: Array<string> = [];
    const tx = {
      execute: vi.fn(async (query: { queryChunks: Array<unknown> }) => {
        const queryText = getQueryText(query);
        calls.push(queryText);

        if (queryText.includes('max')) {
          return { rows: [{ saleOrderNo: 42 }] };
        }

        return { rows: [] };
      }),
    };

    await expect(getSaleOrderNo(tx)).resolves.toBe(42);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('pg_advisory_xact_lock');
    expect(calls[1]).toContain('max');
  });

  it('coerces the allocated sale order number when the database returns a string', async () => {
    const tx = {
      execute: vi.fn(async (query: { queryChunks: Array<unknown> }) => {
        if (getQueryText(query).includes('max')) {
          return { rows: [{ saleOrderNo: '42' }] };
        }

        return { rows: [] };
      }),
    };

    await expect(getSaleOrderNo(tx)).resolves.toBe(42);
  });

  it('throws when the allocated sale order number is not usable', async () => {
    const tx = {
      execute: vi.fn(async (query: { queryChunks: Array<unknown> }) => {
        if (getQueryText(query).includes('max')) {
          return { rows: [{ saleOrderNo: null }] };
        }

        return { rows: [] };
      }),
    };

    await expect(getSaleOrderNo(tx)).rejects.toThrow(
      'Unable to allocate sale order number',
    );
  });
});

describe('getSalesOrders', () => {
  it('includes current financial year date filter when no search params are provided', async () => {
    const { saleUser } = await import('@/features/sales/utils/sale-helpers');
    const { getSalesOrders } = await import(
      '@/features/sales/services/orders/data'
    );
    const dbModule = await import('@/drizzle/db');

    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: true,
      userId: 'user-1',
    });

    let capturedWhereFilters: any = null;

    const mockQueryBuilder = {
      from: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      as: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn((whereClause) => {
        capturedWhereFilters = whereClause;
        return mockQueryBuilder;
      }),
      orderBy: vi.fn().mockResolvedValue([]),
    };

    (dbModule.default as any).select = vi.fn().mockReturnValue(mockQueryBuilder);

    await getSalesOrders({
      search: '',
      account: '',
      salesPerson: '',
      from: undefined,
      to: undefined,
    });

    expect(capturedWhereFilters).toBeDefined();
    const queryStr = getQueryText(capturedWhereFilters);
    expect(queryStr).toContain('date_raised');
  });

  it('disregards date filter when search params are provided', async () => {
    const { saleUser } = await import('@/features/sales/utils/sale-helpers');
    const { getSalesOrders } = await import(
      '@/features/sales/services/orders/data'
    );
    const dbModule = await import('@/drizzle/db');

    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: true,
      userId: 'user-1',
    });

    let capturedWhereFilters: any = null;

    const mockQueryBuilder = {
      from: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      as: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn((whereClause) => {
        capturedWhereFilters = whereClause;
        return mockQueryBuilder;
      }),
      orderBy: vi.fn().mockResolvedValue([]),
    };

    (dbModule.default as any).select = vi.fn().mockReturnValue(mockQueryBuilder);

    await getSalesOrders({
      search: 'Acme',
      account: '',
      salesPerson: '',
      from: undefined,
      to: undefined,
    });

    expect(capturedWhereFilters).toBeDefined();
    const queryStr = getQueryText(capturedWhereFilters);
    expect(queryStr).not.toContain('date_raised');
    expect(queryStr).toContain('Acme');
  });
});

