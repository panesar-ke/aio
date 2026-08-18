import type { SQL } from 'drizzle-orm';

import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cacheTag } = vi.hoisted(() => ({
  cacheTag: vi.fn(),
}));

vi.mock('next/cache', () => ({
  cacheTag,
}));

vi.mock('@/features/admin/utils/cache', () => ({
  getActiveSessionsGlobalTag: vi.fn(() => 'active-sessions'),
  getFormsGlobalTag: vi.fn(),
  getUserFormsGlobalTag: vi.fn(),
  getUsersGlobalTag: vi.fn(),
  getUserTag: vi.fn(),
}));

const captured: {
  where: SQL | undefined;
  orderBy: unknown;
} = {
  where: undefined,
  orderBy: null,
};

const mockOrderBy = vi.fn((orderByClause: unknown) => {
  captured.orderBy = orderByClause;
  return [];
});

const mockWhere = vi.fn((whereClause: SQL | undefined) => {
  captured.where = whereClause;
  return {
    orderBy: mockOrderBy,
  };
});

const mockInnerJoin = vi.fn().mockReturnValue({
  where: mockWhere,
});

const mockFrom = vi.fn().mockReturnValue({
  innerJoin: mockInnerJoin,
});

const mockSelect = vi.fn().mockReturnValue({
  from: mockFrom,
});

vi.mock('@/drizzle/db', () => ({
  default: {
    select: (...args: Array<unknown>) => mockSelect(...args),
  },
}));

import { getActiveSessions } from '@/features/admin/services/data';

describe('getActiveSessions', () => {
  beforeEach(() => {
    captured.where = undefined;
    captured.orderBy = null;
    vi.clearAllMocks();
  });

  it('tags the active sessions cache', async () => {
    await getActiveSessions();

    expect(cacheTag).toHaveBeenCalledWith('active-sessions');
  });

  it('filters out expired sessions', async () => {
    await getActiveSessions();

    const dialect = new PgDialect();
    const query = dialect.sqlToQuery(captured.where as SQL);

    expect(query.sql).toContain('"sessions"."expires_at" > now()');
  });

  it('searches by user name and email while keeping the expiry filter', async () => {
    await getActiveSessions('Acme');

    const dialect = new PgDialect();
    const query = dialect.sqlToQuery(captured.where as SQL);

    expect(query.sql).toContain('"sessions"."expires_at" > now()');
    expect(query.sql).toContain('"users"."name" ilike');
    expect(query.sql).toContain('"users"."email" ilike');
    expect(query.params).toEqual(['%Acme%', '%Acme%']);
  });

  it('orders sessions by last activity descending with nulls last', async () => {
    await getActiveSessions();

    expect(mockOrderBy).toHaveBeenCalledTimes(1);
    expect(captured.orderBy).toMatchObject({
      queryChunks: expect.arrayContaining([
        expect.objectContaining({
          value: [' desc nulls last'],
        }),
      ]),
    });
  });
});
