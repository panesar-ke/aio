import { describe, expect, it, vi } from 'vitest';

// actions.ts transitively imports @/lib/session (via global/services/actions.ts) and
// @/lib/permissions/service (via admins.ts), both of which have a top-level
// `import 'server-only'` that throws outside Next's runtime — mocked here the
// same way src/proxy.test.ts mocks @/lib/session, since only the pure
// buildDeactivationItemRow formatter is under test.
vi.mock('@/lib/session', () => ({
  getCurrentUserOrNull: vi.fn(),
}));
vi.mock('@/lib/permissions/service', () => ({
  ADMIN_USER_TYPES: new Set(),
}));

import {
  buildDeactivationItemRow,
  buildProductDeactivationNotificationEventId,
} from '@/features/store/services/product-deactivation/actions';

describe('buildDeactivationItemRow', () => {
  it('formats a real-usage candidate with its balance', () => {
    const row = buildDeactivationItemRow(
      {
        productId: 'product-1',
        createdOn: null,
        lastUsedDate: new Date('2025-01-15'),
        lastUsedSource: 'stock_movements',
      },
      12.5,
    );

    expect(row).toEqual({
      productId: 'product-1',
      lastUsedDate: '2025-01-15',
      lastUsedSource: 'stock_movements',
      balanceAtDeactivation: '12.5',
    });
  });

  it('formats a never-referenced legacy candidate with a null lastUsedDate', () => {
    const row = buildDeactivationItemRow(
      {
        productId: 'product-2',
        createdOn: null,
        lastUsedDate: null,
        lastUsedSource: 'never_referenced',
      },
      0,
    );

    expect(row).toEqual({
      productId: 'product-2',
      lastUsedDate: null,
      lastUsedSource: 'never_referenced',
      balanceAtDeactivation: '0',
    });
  });
});

describe('buildProductDeactivationNotificationEventId', () => {
  it('is stable per batch and admin', () => {
    expect(
      buildProductDeactivationNotificationEventId('batch-1', 'user-7'),
    ).toBe('product-deactivation:batch-1:user-7');
  });
});
