import { describe, expect, it } from 'vitest';

import {
  formatSaleOrderAmount,
  formatSaleOrderNo,
} from '@/features/sales/utils/sale-order-format';

describe('formatSaleOrderAmount', () => {
  it('labels the amount with the order currency rather than assuming KES', () => {
    expect(formatSaleOrderAmount('KES', 1234.5)).toBe('KES 1,234.50');
    expect(formatSaleOrderAmount('USD', 1234.5)).toBe('USD 1,234.50');
  });

  it('accepts the numeric strings postgres returns', () => {
    expect(formatSaleOrderAmount('USD', '980.00')).toBe('USD 980.00');
  });
});

describe('formatSaleOrderNo', () => {
  it('pads the order number and uses the year it was raised', () => {
    expect(formatSaleOrderNo(1098, '2026-08-13')).toBe('SO/2026/1098');
    expect(formatSaleOrderNo(7, '2025-01-02')).toBe('SO/2025/0007');
  });
});
