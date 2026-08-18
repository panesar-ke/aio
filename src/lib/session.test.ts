import type { SQL } from 'drizzle-orm';

import { PgDialect } from 'drizzle-orm/pg-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sessions } from '@/drizzle/schema';

vi.mock('server-only', () => ({}));

const {
  jwtVerify,
  cookies,
  redirect,
  findLiveSession,
  findUser,
  updateWhere,
  updateSet,
} = vi.hoisted(() => ({
  jwtVerify: vi.fn(),
  cookies: vi.fn(),
  redirect: vi.fn(),
  findLiveSession: vi.fn(),
  findUser: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
}));

vi.mock('jose', () => ({
  jwtVerify,
  SignJWT: class {
    setProtectedHeader() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    async sign() {
      return 'signed-token';
    }
  },
}));

vi.mock('next/headers', () => ({
  cookies,
  headers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect,
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    cache: <T extends (...args: Array<any>) => any>(fn: T) => fn,
  };
});

vi.mock('@/env/server', () => ({
  env: {
    SESSION_SECRET: 'test-secret',
  },
}));

vi.mock('@/drizzle/db', () => ({
  default: {
    query: {
      sessions: {
        findFirst: findLiveSession,
      },
      users: {
        findFirst: findUser,
      },
    },
    update: vi.fn(() => ({
      set: updateSet,
    })),
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-18T12:00:00.000Z'));
  vi.clearAllMocks();

  cookies.mockResolvedValue({
    get: vi.fn(() => ({ value: 'session-cookie' })),
  });
  jwtVerify.mockResolvedValue({
    payload: {
      userId: 'user-1',
      sessionId: 'session-1',
      expiresAt: new Date('2026-08-25T12:00:00.000Z'),
    },
  });
  findLiveSession.mockResolvedValue({
    id: 'session-1',
    lastActivityAt: '2026-08-18T11:00:00.000Z',
  });
  findUser.mockResolvedValue({
    id: 'user-1',
    image: null,
    hasAdminPriviledges: false,
    name: 'Test User',
    email: 'user@example.com',
    userType: 'ADMIN',
    passwordPolicyVersion: 1,
    passwordPolicyExemptUntil: null,
  });
  updateSet.mockReturnValue({
    where: updateWhere,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getCurrentUserOrNull', () => {
  it('updates session activity monotonically', async () => {
    const { getCurrentUserOrNull } = await import('@/lib/session');

    await getCurrentUserOrNull();

    expect(updateSet).toHaveBeenCalledWith({
      lastActivityAt: new Date('2026-08-18T12:00:00.000Z'),
    });
    const dialect = new PgDialect();
    const query = dialect.sqlToQuery(updateWhere.mock.calls[0][0] as SQL);
    expect(query.sql).toContain('"sessions"."id" = $1');
    expect(query.sql).toContain('"sessions"."last_activity_at" is null');
    expect(query.sql).toContain('"sessions"."last_activity_at" < $2');
    expect(query.params[0]).toBe('session-1');
    expect(query.params[1]).toBe('2026-08-18T12:00:00.000Z');
  });
});
