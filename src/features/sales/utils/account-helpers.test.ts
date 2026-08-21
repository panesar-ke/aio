import { describe, expect, it } from 'vitest';

import {
  buildSalesOrderLabel,
  formatCompactCurrency,
} from '@/features/sales/utils/account-helpers';

describe('buildSalesOrderLabel', () => {
  it('builds the sales order label from order year and sale order number', () => {
    expect(buildSalesOrderLabel(1142, '2023-11-06')).toBe('SO-2023-1142');
  });
});

describe('formatCompactCurrency', () => {
  it('formats local-currency aggregates in compact KES notation', () => {
    expect(formatCompactCurrency(1000000)).toBe('KES 1M');
  });
});
