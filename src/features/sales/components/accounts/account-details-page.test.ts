import { describe, expect, it } from 'vitest';

import {
  getAccountOrderMetrics,
  getRelativeTimeLabel,
} from '@/features/sales/components/accounts/account-details-page';
import { createAccountOrderColumns } from '@/features/sales/components/accounts/account-orders-table';
import { buildSalesOrderLabel } from '@/features/sales/utils/account-helpers';

describe('buildSalesOrderLabel', () => {
  it('builds the sales order label from order year and sale order number', () => {
    expect(buildSalesOrderLabel(1142, '2023-11-06')).toBe('SO-2023-1142');
  });
});

describe('getAccountOrderMetrics', () => {
  it('derives totals, average value, total items and last purchase details', () => {
    expect(
      getAccountOrderMetrics([
        {
          id: 1,
          saleOrderNo: 1142,
          dateRaised: '2023-11-06',
          amountInclusive: '412000',
          itemCount: '8',
        },
        {
          id: 2,
          saleOrderNo: 987,
          dateRaised: '2023-08-22',
          amountInclusive: '298000',
          itemCount: '5',
        },
      ]),
    ).toEqual({
      averageOrderValue: 355000,
      lastPurchaseDate: '2023-11-06',
      totalItems: 13,
      totalOrders: 2,
      totalSpend: 710000,
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
  it('includes a fulfilled status column for the paginated orders table', () => {
    const columns = createAccountOrderColumns();
    const statusColumn = columns.find((column) => column.id === 'status');

    expect(statusColumn).toBeDefined();
  });
});
