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
import { getFinancialYearStart } from '@/lib/helpers/dates';

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

  const createSelectMock = (results: Array<Array<Record<string, unknown>>> = []) => {
    const captured: Array<unknown> = [];
    let selectCall = 0;

    const createBuilder = (result: Array<Record<string, unknown>>) => {
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
        limit: vi.fn().mockResolvedValue(result),
        then: (resolve: (value: Array<Record<string, unknown>>) => unknown) =>
          Promise.resolve(resolve(result)),
      };

      return builder;
    };

    (db as { select?: unknown }).select = vi.fn(() =>
      createBuilder(results[selectCall++] ?? []),
    );

    return { captured };
  };

  it('defaults to the selected financial year range when no sales person filter is provided', async () => {
    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: true,
      userId: 'user-1',
    });

    const { captured: clauses } = createSelectMock();

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

    const { captured: clauses } = createSelectMock();

    await getSalesDashboard({
      financialYear: '2026',
      salesPerson: 'rep-2',
    });

    const queryText = clauses.map(getQueryText).join(' ');
    expect(queryText).toContain('sales_rep_id');
    expect(queryText).toContain('rep-1');
    expect(queryText).not.toContain('rep-2');
  });

  it('falls back to the current financial year when the requested year is outside the dashboard options', async () => {
    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: true,
      userId: 'user-1',
    });

    createSelectMock();

    await expect(
      getSalesDashboard({
        financialYear: '1900',
        salesPerson: '',
      }),
    ).resolves.toMatchObject({
      filters: {
        financialYear: getFinancialYearStart().toString(),
      },
    });
  });

  it('builds recent order activity titles with the shared sales order label helper', async () => {
    vi.mocked(saleUser).mockResolvedValueOnce({
      isSalesAdmin: true,
      userId: 'user-1',
    });

    createSelectMock([
      [{ revenue: 0, orders: 0, activeAccounts: 0 }],
      [{ revenue: 0, orders: 0, activeAccounts: 0 }],
      [{ total: 0 }],
      [{ total: 0 }],
      [],
      [],
      [],
      [],
      [],
      [
        {
          id: 9,
          date: '2026-08-20',
          saleOrderNo: 42,
          company: 'ACME',
          amount: '1000',
        },
      ],
      [],
      [],
    ]);

    await expect(
      getSalesDashboard({
        financialYear: getFinancialYearStart().toString(),
        salesPerson: '',
      }),
    ).resolves.toMatchObject({
      recentActivity: [
        expect.objectContaining({
          title: 'Sale order SO-2026-42',
        }),
      ],
    });
  });
});
