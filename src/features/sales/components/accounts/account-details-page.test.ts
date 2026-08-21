import { describe, expect, it } from 'vitest';

import {
  getAccountOrderMetrics,
  getRelativeTimeLabel,
} from '@/features/sales/components/accounts/account-details-page';
import { createAccountOrderColumns } from '@/features/sales/components/accounts/account-orders-table';

const order = (
  overrides: Partial<Parameters<typeof getAccountOrderMetrics>[0][number]>,
) => ({
  id: 1,
  saleOrderNo: 1142,
  dateRaised: '2023-11-06',
  amountInclusive: '412000',
  currency: 'KES',
  amountInLocalCurrency: '412000',
  status: 'fulfilled' as const,
  itemCount: '8',
  ...overrides,
});

describe('getAccountOrderMetrics', () => {
  it('derives totals, average value, total items and last purchase details', () => {
    expect(
      getAccountOrderMetrics([
        order({}),
        order({
          id: 2,
          saleOrderNo: 987,
          dateRaised: '2023-08-22',
          amountInclusive: '298000',
          amountInLocalCurrency: '298000',
          itemCount: '5',
        }),
      ]),
    ).toEqual({
      averageOrderValue: 355000,
      lastPurchaseDate: '2023-11-06',
      totalItems: 13,
      totalOrders: 2,
      totalSpend: 710000,
    });
  });

  it('sums the local-currency amount so KES and USD orders are comparable', () => {
    // A USD 1,000 order at 130.00 is KES 130,000 - adding the raw inclusive
    // amounts instead would produce a meaningless 101,000.
    const metrics = getAccountOrderMetrics([
      order({ amountInclusive: '100000', amountInLocalCurrency: '100000' }),
      order({
        id: 2,
        currency: 'USD',
        amountInclusive: '1000',
        amountInLocalCurrency: '130000',
      }),
    ]);

    expect(metrics.totalSpend).toBe(230000);
    expect(metrics.averageOrderValue).toBe(115000);
  });

  it('excludes cancelled orders from every spend metric', () => {
    const metrics = getAccountOrderMetrics([
      order({
        id: 3,
        dateRaised: '2024-02-01',
        amountInLocalCurrency: '900000',
        itemCount: '20',
        status: 'cancelled',
      }),
      order({}),
    ]);

    expect(metrics.totalSpend).toBe(412000);
    expect(metrics.totalOrders).toBe(1);
    expect(metrics.totalItems).toBe(8);
    expect(metrics.lastPurchaseDate).toBe('2023-11-06');
  });

  it('returns zeroed metrics when every order is cancelled', () => {
    expect(getAccountOrderMetrics([order({ status: 'cancelled' })])).toEqual({
      averageOrderValue: 0,
      lastPurchaseDate: null,
      totalItems: 0,
      totalOrders: 0,
      totalSpend: 0,
    });
  });

  it('returns zeroed metrics when there are no orders', () => {
    expect(getAccountOrderMetrics([])).toEqual({
      averageOrderValue: 0,
      lastPurchaseDate: null,
      totalItems: 0,
      totalOrders: 0,
      totalSpend: 0,
    });
  });
});

describe('getRelativeTimeLabel', () => {
  it('returns the two largest duration parts with an ago suffix', () => {
    expect(
      getRelativeTimeLabel('2023-11-06', new Date('2026-08-12T00:00:00.000Z')),
    ).toBe('2 years, 9 months ago');
  });
});

describe('createAccountOrderColumns', () => {
  it('reads the status column off the order instead of hardcoding it', () => {
    const columns = createAccountOrderColumns();
    const statusColumn = columns.find(
      (column) => 'accessorKey' in column && column.accessorKey === 'status',
    );

    expect(statusColumn).toBeDefined();
  });
});
