import { describe, expect, it } from 'vitest';

import { headersMatchTemplate } from '@/features/procurement/services/products-import/template-validation';

describe('headersMatchTemplate', () => {
  it('accepts the exact template headers', () => {
    expect(headersMatchTemplate(['product_name', 'price', 'opening_qty'])).toBe(true);
  });

  it('rejects reordered headers', () => {
    expect(headersMatchTemplate(['price', 'product_name', 'opening_qty'])).toBe(false);
  });

  it('rejects a missing column', () => {
    expect(headersMatchTemplate(['product_name', 'opening_qty'])).toBe(false);
  });

  it('is case-insensitive on the incoming header text', () => {
    expect(headersMatchTemplate(['Product_Name', 'Price', 'Opening_Qty'])).toBe(true);
  });
});
