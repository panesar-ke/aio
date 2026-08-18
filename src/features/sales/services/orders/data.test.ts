import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/drizzle/db', () => ({
  default: {},
}));
vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
}));
vi.mock('@/features/sales/utils/sale-helpers', () => ({
  saleUser: vi.fn(),
}));

import db from '@/drizzle/db';
import {
  getSaleOrderNo,
  getSalesOrders,
} from '@/features/sales/services/orders/data';
import { saleUser } from '@/features/sales/utils/sale-helpers';

type QueryObject = {
  name?: string;
  value?: unknown;
  queryChunks?: Array<unknown>;
};

function isQueryObject(value: unknown): value is QueryObject {
  return typeof value === 'object' && value !== null;
}

const getQueryText = (query: unknown): string => {
  if (!query) return '';
  if (typeof query === 'string') return query;
  if (!isQueryObject(query)) return '';
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
  afterEach(() => {
    // db is a bare object from the module mock, so the stub below has to be
    // removed by hand or it leaks into every test that runs after this file.
    delete (db as Partial<typeof db>).select;
    vi.clearAllMocks();
  });

  const captureWhereFilters = () => {
    const captured: { filters: unknown } = { filters: null };

    const mockQueryBuilder = {
      from: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      as: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn((whereClause) => {
        captured.filters = whereClause;
        return mockQueryBuilder;
      }),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    (
      db as Partial<typeof db> & {
        select?: ReturnType<typeof vi.fn>;
      }
    ).select = vi.fn().mockReturnValue(mockQueryBuilder);

    return { captured, mockQueryBuilder };
  };

  const noFilters = {
    search: '',
    account: '',
    salesPerson: '',
    from: null,
    to: null,
  };

  it('includes current financial year date filter when no search params are provided', async () => {
    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: true,
      userId: 'user-1',
    });

    const { captured } = captureWhereFilters();

    await getSalesOrders(noFilters);

    expect(captured.filters).toBeDefined();
    expect(getQueryText(captured.filters)).toContain('date_raised');
  });

  it('disregards date filter when search params are provided', async () => {
    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: true,
      userId: 'user-1',
    });

    const { captured } = captureWhereFilters();

    await getSalesOrders({ ...noFilters, search: 'Acme' });

    const queryStr = getQueryText(captured.filters);
    expect(queryStr).not.toContain('date_raised');
    expect(queryStr).toContain('Acme');
  });

  it('disregards date filter when a non-admin rep searches', async () => {
    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: false,
      userId: 'user-1',
    });

    const { captured } = captureWhereFilters();

    await getSalesOrders({ ...noFilters, search: 'Acme' });

    const queryStr = getQueryText(captured.filters);
    expect(queryStr).not.toContain('date_raised');
    expect(queryStr).toContain('Acme');
  });

  it('keeps the date filter for a non-admin rep when salesPerson is the only param', async () => {
    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: false,
      userId: 'user-1',
    });

    const { captured } = captureWhereFilters();

    // salesPerson is ignored for non-admins, so on its own it must not lift the
    // financial year bound.
    await getSalesOrders({ ...noFilters, salesPerson: 'user-2' });

    expect(getQueryText(captured.filters)).toContain('date_raised');
  });

  it('caps the number of rows returned', async () => {
    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: true,
      userId: 'user-1',
    });

    const { mockQueryBuilder } = captureWhereFilters();

    await getSalesOrders({ ...noFilters, search: 'Acme' });

    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(500);
  });
});
