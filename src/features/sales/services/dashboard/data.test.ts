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
import { getSalesDashboard } from '@/features/sales/services/dashboard/data';
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

describe('getSalesDashboard', () => {
  afterEach(() => {
    delete (db as Partial<typeof db>).select;
    vi.clearAllMocks();
  });

  const captureWhereClauses = () => {
    const captured: Array<unknown> = [];

    const createBuilder = () => {
      const builder = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn((whereClause) => {
          captured.push(whereClause);
          return builder;
        }),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        then: (resolve: (value: Array<Record<string, unknown>>) => unknown) =>
          Promise.resolve(resolve([])),
      };

      return builder;
    };

    (db as { select?: unknown }).select = vi.fn(() => createBuilder());

    return captured;
  };

  it('defaults to the selected financial year range when no sales person filter is provided', async () => {
    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: true,
      userId: 'user-1',
    });

    const clauses = captureWhereClauses();

    await getSalesDashboard({
      financialYear: '2026',
      salesPerson: '',
    });

    expect(clauses).not.toHaveLength(0);
    expect(getQueryText(clauses[0])).toContain('date_raised');
  });

  it('always scopes non-admin users to their own sales even when a sales person filter is supplied', async () => {
    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: false,
      userId: 'rep-1',
    });

    const clauses = captureWhereClauses();

    await getSalesDashboard({
      financialYear: '2026',
      salesPerson: 'rep-2',
    });

    const queryText = clauses.map(getQueryText).join(' ');
    expect(queryText).toContain('sales_rep_id');
    expect(queryText).toContain('rep-1');
    expect(queryText).not.toContain('rep-2');
  });
});
