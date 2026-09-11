import { and, eq, gte, inArray } from 'drizzle-orm';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  deleteWhere,
  execute,
  findMany,
  insertReturning,
  insertValues,
  selectLimit,
  updateSet,
  updateWhere,
} = vi.hoisted(() => ({
  findMany: vi.fn(),
  execute: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  deleteWhere: vi.fn(),
  selectLimit: vi.fn(),
}));

vi.mock('@/env/server', () => ({
  env: { DATABASE_URL: 'postgres://test' },
}));

vi.mock('@/drizzle/db', () => {
  // The reservation counts and inserts on one transaction handle; everything
  // else runs on the pool.
  const transactionClient = {
    query: { loginAttempts: { findMany } },
    execute,
    insert: vi.fn(() => ({ values: insertValues })),
  };

  return {
    default: {
      query: { loginAttempts: { findMany } },
      transaction: vi.fn((run: (tx: unknown) => unknown) =>
        run(transactionClient)
      ),
      update: vi.fn(() => ({ set: updateSet })),
      delete: vi.fn(() => ({ where: deleteWhere })),
      // The prune narrows each chunk with a subquery; its shape does not matter
      // here, only that one statement is issued per chunk.
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: selectLimit })),
        })),
      })),
    },
  };
});

import { loginAttempts } from '@/drizzle/schema';
import {
  clearLoginFailures,
  deleteLoginAttemptsChunk,
  LOGIN_ATTEMPT_LIMIT,
  LOGIN_ATTEMPT_WINDOW_MINUTES,
  loginAttemptWindowStart,
  markLoginAttemptSucceeded,
  reserveLoginAttempt,
} from '@/features/auth/services/login-throttle';
import {
  MAX_LOGIN_IDENTIFIER_LENGTH,
  MAX_LOGIN_IP_ADDRESS_LENGTH,
  MAX_LOGIN_USER_AGENT_LENGTH,
} from '@/features/auth/utils/login-attempt-fields';

const NOW = new Date('2026-09-10T12:00:00.000Z');
const WINDOW_MS = LOGIN_ATTEMPT_WINDOW_MINUTES * 60 * 1000;

/** `n` failures, the oldest `minutesAgo` old, one minute apart, ascending. */
function failures(n: number, minutesAgo: number) {
  return Array.from({ length: n }, (_, index) => ({
    createdAt: new Date(NOW.getTime() - (minutesAgo - index) * 60 * 1000),
  }));
}

function reserve(identifiers: Array<string>) {
  return reserveLoginAttempt(
    { identifiers, identifier: identifiers[0] },
    NOW
  );
}

describe('loginAttemptWindowStart', () => {
  test('trails now by the window length', () => {
    expect(loginAttemptWindowStart(NOW).toISOString()).toBe(
      '2026-09-10T11:45:00.000Z'
    );
  });
});

describe('reserveLoginAttempt', () => {
  beforeEach(() => {
    findMany.mockReset();
    execute.mockReset();
    execute.mockResolvedValue(undefined);
    insertValues.mockReset();
    insertValues.mockReturnValue({ returning: insertReturning });
    insertReturning.mockReset();
    insertReturning.mockResolvedValue([{ id: 'attempt-1' }]);
  });

  test('claims an attempt when the budget has room', async () => {
    findMany.mockResolvedValue([]);

    expect(await reserve(['someone@example.com'])).toEqual({
      reserved: true,
      attemptId: 'attempt-1',
    });
  });

  test('records the claim as a failure until the password proves out', async () => {
    findMany.mockResolvedValue([]);

    await reserveLoginAttempt(
      {
        identifiers: ['jane@example.com', '0700000000'],
        identifier: 'jane@example.com',
        userId: 'user-1',
        ipAddress: '203.0.113.7',
        userAgent: 'Mozilla/5.0',
      },
      NOW
    );

    // Written before the password check, so an attempt that dies mid-flight
    // still counts against the budget instead of vanishing from it.
    expect(insertValues).toHaveBeenCalledWith({
      identifier: 'jane@example.com',
      succeeded: false,
      userId: 'user-1',
      ipAddress: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
    });
  });

  test('nulls the audit fields that were never supplied', async () => {
    findMany.mockResolvedValue([]);

    await reserve(['someone@example.com']);

    expect(insertValues).toHaveBeenCalledWith({
      identifier: 'someone@example.com',
      succeeded: false,
      userId: null,
      ipAddress: null,
      userAgent: null,
    });
  });

  test('does not refuse one attempt below the limit', async () => {
    findMany.mockResolvedValue(failures(LOGIN_ATTEMPT_LIMIT - 1, 10));

    expect(await reserve(['someone@example.com'])).toEqual({
      reserved: true,
      attemptId: 'attempt-1',
    });
  });

  test('refuses exactly at the limit', async () => {
    const rows = failures(LOGIN_ATTEMPT_LIMIT, 10);
    findMany.mockResolvedValue(rows);

    const result = await reserve(['someone@example.com']);

    expect(result.reserved).toBe(false);
    // At the limit the oldest failure is the one whose expiry reopens sign-in.
    expect(result.reserved === false && result.retryAfter?.getTime()).toBe(
      rows[0].createdAt.getTime() + WINDOW_MS
    );
  });

  test('past the limit, waits for enough failures to age out', async () => {
    const rows = failures(LOGIN_ATTEMPT_LIMIT + 2, 12);
    findMany.mockResolvedValue(rows);

    const result = await reserve(['someone@example.com']);

    // Three must expire to drop the count from 7 back under 5, so the third
    // oldest — index 2 — is the one that matters, not the oldest.
    expect(result.reserved === false && result.retryAfter?.getTime()).toBe(
      rows[2].createdAt.getTime() + WINDOW_MS
    );
  });

  test('writes nothing for a refusal, so retrying cannot extend the block', async () => {
    findMany.mockResolvedValue(failures(LOGIN_ATTEMPT_LIMIT, 10));

    await reserve(['someone@example.com']);

    // retryAfter is read off the row at `count - LIMIT`, so every extra row
    // pushes it later: recording refusals meant the window only expired for a
    // caller who stopped following its own advice.
    expect(insertValues).not.toHaveBeenCalled();
  });

  test('counts only failures inside the window', async () => {
    findMany.mockResolvedValue([]);

    await reserve(['someone@example.com']);

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

    await reserve(['jane@example.com', '0700000000']);

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

  test('locks before it counts', async () => {
    findMany.mockResolvedValue([]);

    await reserve(['someone@example.com']);

    // The lock is the whole point: counting outside it let simultaneous
    // submissions all read the same under-limit count and each buy a password
    // check.
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.invocationCallOrder[0]).toBeLessThan(
      findMany.mock.invocationCallOrder[0]
    );
  });

  test('locks on the identifier set, not the string that was submitted', async () => {
    findMany.mockResolvedValue([]);

    await reserve(['jane@example.com', '0700000000']);
    await reserve(['0700000000', 'jane@example.com']);

    // Signing in by email and by contact must serialize against each other, or
    // the shared budget is only shared for callers who take turns.
    expect(execute.mock.calls[1][0]).toEqual(execute.mock.calls[0][0]);
  });

  test('bounds the client-controlled strings it stores', async () => {
    findMany.mockResolvedValue([]);

    await reserveLoginAttempt(
      {
        identifiers: ['a'.repeat(400)],
        identifier: 'a'.repeat(400),
        ipAddress: 'f'.repeat(80),
        userAgent: 'u'.repeat(900),
      },
      NOW
    );

    // identifier leads a btree index, so an oversized one is not a storage
    // cost but a failed insert — and a failed insert is an uncounted attempt.
    const values = insertValues.mock.calls[0][0];

    expect(values.identifier).toHaveLength(MAX_LOGIN_IDENTIFIER_LENGTH);
    expect(values.ipAddress).toHaveLength(MAX_LOGIN_IP_ADDRESS_LENGTH);
    expect(values.userAgent).toHaveLength(MAX_LOGIN_USER_AGENT_LENGTH);
  });
});

describe('markLoginAttemptSucceeded', () => {
  beforeEach(() => {
    updateSet.mockReset();
    updateSet.mockReturnValue({ where: updateWhere });
    updateWhere.mockReset();
    updateWhere.mockResolvedValue({ rowCount: 1 });
  });

  test('flips the reserved row rather than writing a second one', async () => {
    await markLoginAttemptSucceeded('attempt-1');

    expect(updateSet).toHaveBeenCalledWith({ succeeded: true });
    expect(updateWhere).toHaveBeenCalledWith(
      eq(loginAttempts.id, 'attempt-1')
    );
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

describe('deleteLoginAttemptsChunk', () => {
  beforeEach(() => {
    deleteWhere.mockReset();
    selectLimit.mockReturnValue('chunk-subquery');
  });

  test('removes one chunk per call, counted by the driver', async () => {
    deleteWhere.mockResolvedValue({ rowCount: 2 });

    // One statement, not a loop: the prune drives the chunks as separate
    // Inngest steps so no single step has to outlast the whole backlog.
    expect(await deleteLoginAttemptsChunk(NOW, 10)).toBe(2);
    expect(deleteWhere).toHaveBeenCalledTimes(1);
  });

  test('treats a missing rowCount as nothing deleted', async () => {
    deleteWhere.mockResolvedValue({ rowCount: null });

    expect(await deleteLoginAttemptsChunk(NOW, 10)).toBe(0);
  });
});
