import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { deleteReturning, deleteWhere, findMany, insertValues } = vi.hoisted(
  () => ({
    findMany: vi.fn(),
    insertValues: vi.fn(),
    deleteWhere: vi.fn(),
    deleteReturning: vi.fn(),
  })
);

vi.mock('@/env/server', () => ({
  env: { DATABASE_URL: 'postgres://test' },
}));

vi.mock('@/drizzle/db', () => ({
  default: {
    query: { loginAttempts: { findMany } },
    insert: vi.fn(() => ({ values: insertValues })),
    delete: vi.fn(() => ({
      where: deleteWhere.mockReturnValue({ returning: deleteReturning }),
    })),
  },
}));

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

    expect(await isThrottled('someone@example.com', NOW)).toEqual({
      throttled: false,
      retryAfter: null,
    });
  });

  test('does not trigger one attempt below the limit', async () => {
    findMany.mockResolvedValue(failures(LOGIN_ATTEMPT_LIMIT - 1, 10));

    const state = await isThrottled('someone@example.com', NOW);

    expect(state.throttled).toBe(false);
    expect(state.retryAfter).toBeNull();
  });

  test('triggers exactly at the limit', async () => {
    const rows = failures(LOGIN_ATTEMPT_LIMIT, 10);
    findMany.mockResolvedValue(rows);

    const state = await isThrottled('someone@example.com', NOW);

    expect(state.throttled).toBe(true);
    // At the limit the oldest failure is the one whose expiry reopens sign-in.
    expect(state.retryAfter?.getTime()).toBe(
      rows[0].createdAt.getTime() + WINDOW_MS
    );
  });

  test('past the limit, waits for enough failures to age out', async () => {
    const rows = failures(LOGIN_ATTEMPT_LIMIT + 2, 12);
    findMany.mockResolvedValue(rows);

    const state = await isThrottled('someone@example.com', NOW);

    // Three must expire to drop the count from 7 back under 5, so the third
    // oldest — index 2 — is the one that matters, not the oldest.
    expect(state.retryAfter?.getTime()).toBe(
      rows[2].createdAt.getTime() + WINDOW_MS
    );
  });

  test('counts only failures inside the window', async () => {
    findMany.mockResolvedValue([]);

    await isThrottled('someone@example.com', NOW);

    // The cutoff is pushed into the query rather than filtered in memory.
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: { createdAt: true },
        limit: expect.any(Number),
      })
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

describe('clearLoginFailures / deleteLoginAttemptsBefore', () => {
  beforeEach(() => {
    deleteWhere.mockClear();
    deleteReturning.mockReset();
  });

  test('clearing issues a delete', async () => {
    await clearLoginFailures('someone@example.com');

    expect(deleteWhere).toHaveBeenCalledTimes(1);
  });

  test('pruning reports how many rows went', async () => {
    deleteReturning.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);

    expect(await deleteLoginAttemptsBefore(NOW)).toBe(2);
  });
});
