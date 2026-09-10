import { and, eq, gte, inArray } from 'drizzle-orm';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { deleteWhere, findMany, insertValues, selectLimit } = vi.hoisted(() => ({
  findMany: vi.fn(),
  insertValues: vi.fn(),
  deleteWhere: vi.fn(),
  selectLimit: vi.fn(),
}));

vi.mock('@/env/server', () => ({
  env: { DATABASE_URL: 'postgres://test' },
}));

vi.mock('@/drizzle/db', () => ({
  default: {
    query: { loginAttempts: { findMany } },
    insert: vi.fn(() => ({ values: insertValues })),
    delete: vi.fn(() => ({ where: deleteWhere })),
    // The prune narrows each chunk with a subquery; its shape does not matter
    // here, only that one statement is issued per chunk.
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: selectLimit })),
      })),
    })),
  },
}));

import { loginAttempts } from '@/drizzle/schema';
import {
  clearLoginFailures,
  deleteLoginAttemptsBefore,
  isThrottled,
  LOGIN_ATTEMPT_LIMIT,
  LOGIN_ATTEMPT_WINDOW_MINUTES,
  loginAttemptWindowStart,
  recordLoginAttempt,
} from '@/features/auth/services/login-throttle';

const NOW = new Date('2026-09-10T12:00:00.000Z');
const WINDOW_MS = LOGIN_ATTEMPT_WINDOW_MINUTES * 60 * 1000;

/** `n` failures, the oldest `minutesAgo` old, one minute apart, ascending. */
function failures(n: number, minutesAgo: number) {
  return Array.from({ length: n }, (_, index) => ({
    createdAt: new Date(NOW.getTime() - (minutesAgo - index) * 60 * 1000),
  }));
}

describe('loginAttemptWindowStart', () => {
  test('trails now by the window length', () => {
    expect(loginAttemptWindowStart(NOW).toISOString()).toBe(
      '2026-09-10T11:45:00.000Z'
    );
  });
});

describe('isThrottled', () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  test('allows an identifier with no history', async () => {
    findMany.mockResolvedValue([]);

    expect(await isThrottled(['someone@example.com'], NOW)).toEqual({
      throttled: false,
      retryAfter: null,
    });
  });

  test('does not trigger one attempt below the limit', async () => {
    findMany.mockResolvedValue(failures(LOGIN_ATTEMPT_LIMIT - 1, 10));

    const state = await isThrottled(['someone@example.com'], NOW);

    expect(state.throttled).toBe(false);
    expect(state.retryAfter).toBeNull();
  });

  test('triggers exactly at the limit', async () => {
    const rows = failures(LOGIN_ATTEMPT_LIMIT, 10);
    findMany.mockResolvedValue(rows);

    const state = await isThrottled(['someone@example.com'], NOW);

    expect(state.throttled).toBe(true);
    // At the limit the oldest failure is the one whose expiry reopens sign-in.
    expect(state.retryAfter?.getTime()).toBe(
      rows[0].createdAt.getTime() + WINDOW_MS
    );
  });

  test('past the limit, waits for enough failures to age out', async () => {
    const rows = failures(LOGIN_ATTEMPT_LIMIT + 2, 12);
    findMany.mockResolvedValue(rows);

    const state = await isThrottled(['someone@example.com'], NOW);

    // Three must expire to drop the count from 7 back under 5, so the third
    // oldest — index 2 — is the one that matters, not the oldest.
    expect(state.retryAfter?.getTime()).toBe(
      rows[2].createdAt.getTime() + WINDOW_MS
    );
  });

  test('counts only failures inside the window', async () => {
    findMany.mockResolvedValue([]);

    await isThrottled(['someone@example.com'], NOW);

    // Asserted as the whole clause, not merely that a query ran: dropping the
    // cutoff would turn the rolling window into a permanent block, and an
    // assertion on the shape of the call alone would not notice.
    expect(findMany.mock.calls[0][0].where).toEqual(
      and(
        inArray(loginAttempts.identifier, ['someone@example.com']),
        eq(loginAttempts.succeeded, false),
        gte(loginAttempts.createdAt, loginAttemptWindowStart(NOW))
      )
    );
  });

  test('counts every identifier the same account answers to', async () => {
    findMany.mockResolvedValue([]);

    await isThrottled(['jane@example.com', '0700000000'], NOW);

    // One budget across both, or an account reachable by email and contact
    // gets twice the documented limit.
    expect(findMany.mock.calls[0][0].where).toEqual(
      and(
        inArray(loginAttempts.identifier, ['jane@example.com', '0700000000']),
        eq(loginAttempts.succeeded, false),
        gte(loginAttempts.createdAt, loginAttemptWindowStart(NOW))
      )
    );
  });
});

describe('recordLoginAttempt', () => {
  beforeEach(() => {
    insertValues.mockReset();
  });

  test('writes a failure with null audit fields when nothing is known', async () => {
    await recordLoginAttempt({
      identifier: 'someone@example.com',
      succeeded: false,
    });

    expect(insertValues).toHaveBeenCalledWith({
      identifier: 'someone@example.com',
      succeeded: false,
      userId: null,
      ipAddress: null,
      userAgent: null,
    });
  });

  test('records the resolved user on a success', async () => {
    await recordLoginAttempt({
      identifier: 'someone@example.com',
      succeeded: true,
      userId: 'user-1',
      ipAddress: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
    });

    expect(insertValues).toHaveBeenCalledWith({
      identifier: 'someone@example.com',
      succeeded: true,
      userId: 'user-1',
      ipAddress: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
    });
  });
});

describe('clearLoginFailures', () => {
  beforeEach(() => {
    deleteWhere.mockReset();
    deleteWhere.mockResolvedValue({ rowCount: 0 });
  });

  test('clears only the failures inside the window, for every identifier', async () => {
    await clearLoginFailures(['jane@example.com', '0700000000'], NOW);

    // Bounded on purpose. An unbounded delete let a slow grind that finally
    // guessed right erase its own history on the way in.
    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(deleteWhere.mock.calls[0][0]).toEqual(
      and(
        inArray(loginAttempts.identifier, ['jane@example.com', '0700000000']),
        eq(loginAttempts.succeeded, false),
        gte(loginAttempts.createdAt, loginAttemptWindowStart(NOW))
      )
    );
  });
});

describe('deleteLoginAttemptsBefore', () => {
  beforeEach(() => {
    deleteWhere.mockReset();
    selectLimit.mockReturnValue('chunk-subquery');
  });

  test('reports how many rows went, counted by the driver', async () => {
    deleteWhere.mockResolvedValue({ rowCount: 2 });

    // A short chunk that comes back unfilled ends the loop.
    expect(await deleteLoginAttemptsBefore(NOW, 10)).toBe(2);
    expect(deleteWhere).toHaveBeenCalledTimes(1);
  });

  test('keeps going while each chunk comes back full', async () => {
    deleteWhere
      .mockResolvedValueOnce({ rowCount: 2 })
      .mockResolvedValueOnce({ rowCount: 2 })
      .mockResolvedValueOnce({ rowCount: 1 });

    // Chunked so one unbounded DELETE cannot lock the table for the whole
    // retention backlog or outrun the Inngest step timeout.
    expect(await deleteLoginAttemptsBefore(NOW, 2)).toBe(5);
    expect(deleteWhere).toHaveBeenCalledTimes(3);
  });

  test('treats a missing rowCount as nothing deleted', async () => {
    deleteWhere.mockResolvedValue({ rowCount: null });

    expect(await deleteLoginAttemptsBefore(NOW, 10)).toBe(0);
  });
});
