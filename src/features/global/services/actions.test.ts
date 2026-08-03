import type { SQL } from 'drizzle-orm';

import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it, vi } from 'vitest';

const { insert, onConflictDoNothing } = vi.hoisted(() => {
  const onConflictDoNothing = vi.fn(
    async (config: { target: unknown; where: SQL }) => {
      void config;
    },
  );
  const values = vi.fn(() => ({
    onConflictDoNothing,
  }));
  const insert = vi.fn(() => ({
    values,
  }));

  return {
    insert,
    onConflictDoNothing,
  };
});

vi.mock('@/drizzle/db', () => ({
  default: {
    insert,
  },
}));

vi.mock('@/lib/session', () => ({
  getCurrentUserOrNull: vi.fn(),
}));

import { createNotification } from '@/features/global/services/actions';

describe('createNotification', () => {
  it('uses a conflict-safe insert when eventId is present', async () => {
    await createNotification({
      title: 'Products auto-deactivated',
      path: '/store/deactivated-items/batch-1',
      message: '2 unused stock products were automatically deactivated for review.',
      userId: 'user-1',
      notificationType: 'PRODUCT_DEACTIVATION',
      eventId: 'product-deactivation:batch-1:user-1',
    });

    expect(onConflictDoNothing).toHaveBeenCalledOnce();
    const [config] = onConflictDoNothing.mock.calls[0]!;
    const dialect = new PgDialect();
    expect(dialect.sqlToQuery(config.where).sql).toContain(
      '"event_id" is not null',
    );
  });
});
