import { describe, expect, it } from 'vitest';

import { calculateSaleOrderLineGross } from '@/features/sales/components/orders/sale-order-line-gross';

describe('calculateSaleOrderLineGross', () => {
  it('multiplies qty and rate using numeric coercion', () => {
    expect(calculateSaleOrderLineGross({ qty: '3', rate: '12.5' })).toBe(37.5);
  });

  it('returns zero when qty or rate is missing', () => {
    expect(calculateSaleOrderLineGross({ qty: '', rate: '12.5' })).toBe(0);
    expect(calculateSaleOrderLineGross({ qty: '3', rate: undefined })).toBe(0);
  });
});
