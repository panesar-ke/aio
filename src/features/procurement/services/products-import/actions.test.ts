import { describe, expect, it, vi } from 'vitest';

// Same pattern used in src/features/store/services/product-deactivation/actions.test.ts —
// mock session/permissions so importing this file doesn't pull in `server-only` guards.
vi.mock('@/lib/session', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/permissions/guards', () => ({ requireAnyPermission: vi.fn() }));

import { headersMatchTemplate } from '@/features/procurement/services/products-import/actions';

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
