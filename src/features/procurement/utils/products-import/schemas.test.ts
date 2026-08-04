import { describe, expect, it } from 'vitest';

import {
  productImportHeaderSchema,
  productImportRowSchema,
} from '@/features/procurement/utils/products-import/schemas';

describe('productImportHeaderSchema', () => {
  it('accepts a valid store + today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = productImportHeaderSchema.safeParse({
      storeId: 'store-1',
      asOfDate: today,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing storeId', () => {
    const result = productImportHeaderSchema.safeParse({
      storeId: '',
      asOfDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a future asOfDate', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const result = productImportHeaderSchema.safeParse({
      storeId: 'store-1',
      asOfDate: future.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Opening balance date cannot be in the future.',
      );
    }
  });
});

describe('productImportRowSchema', () => {
  it('accepts a valid row with no price', () => {
    const result = productImportRowSchema.safeParse({
      product_name: 'Bolt 10mm',
      price: null,
      opening_qty: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty product_name', () => {
    const result = productImportRowSchema.safeParse({
      product_name: '',
      price: null,
      opening_qty: 5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative opening_qty', () => {
    const result = productImportRowSchema.safeParse({
      product_name: 'Bolt 10mm',
      price: null,
      opening_qty: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative price', () => {
    const result = productImportRowSchema.safeParse({
      product_name: 'Bolt 10mm',
      price: -5,
      opening_qty: 1,
    });
    expect(result.success).toBe(false);
  });
});
