import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  clearLoginFailures,
  createNotification,
  createSession,
  findFirst,
  hashPassword,
  headersGet,
  isThrottled,
  recordLoginAttempt,
  verifyPassword,
} = vi.hoisted(() => ({
  findFirst: vi.fn(),
  isThrottled: vi.fn(),
  recordLoginAttempt: vi.fn(),
  clearLoginFailures: vi.fn(),
  verifyPassword: vi.fn(),
  createSession: vi.fn(),
  createNotification: vi.fn(),
  headersGet: vi.fn(),
  // Needs an implementation from the start: auth.ts computes its dummy hash
  // at import, before any beforeEach runs.
  hashPassword: vi.fn(async () => 'hashed'),
}));

vi.mock('@/env/server', () => ({
  env: { DATABASE_URL: 'postgres://test', BCRYPT_ROUNDS: '4' },
}));

vi.mock('next/headers', () => ({
  headers: async () => ({ get: headersGet }),
}));

vi.mock('@/drizzle/db', () => ({
  default: {
    query: { users: { findFirst } },
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn() })),
    })),
  },
}));

vi.mock('@/features/admin/utils/helpers', () => ({
  // Any string will do: the dummy-hash comparison only needs to run, and a
  // non-bcrypt string simply compares false.
  hashPassword,
}));

vi.mock('@/features/auth/services/login-throttle', () => ({
  isThrottled,
  recordLoginAttempt,
  clearLoginFailures,
  LOGIN_ATTEMPT_WINDOW_MINUTES: 15,
}));

vi.mock('@/features/auth/utils/password', () => ({ verifyPassword }));

vi.mock('@/features/global/services/actions', () => ({ createNotification }));

vi.mock('@/lib/session', () => ({
  createSession,
  deleteSession: vi.fn(),
}));

import { loginAction } from '@/features/auth/actions/auth';

const activeUser = {
  id: 'user-1',
  active: true,
  password: 'stored-hash',
  passwordChangedAt: new Date('2026-01-01T00:00:00.000Z'),
  passwordPolicyVersion: 1,
  passwordPolicyExemptUntil: null,
  defaultMenu: '/dashboard',
  name: 'Jane Smith',
  email: 'jane@example.com',
  contact: '0700000000',
};

function credentials(overrides: Record<string, unknown> = {}) {
  return { userName: 'jane@example.com', password: 'correct-horse', ...overrides };
}

describe('loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    isThrottled.mockResolvedValue({ throttled: false, retryAfter: null });
    // clearAllMocks keeps implementations, so anything a test makes reject has
    // to be put back explicitly.
    recordLoginAttempt.mockResolvedValue(undefined);
    clearLoginFailures.mockResolvedValue(undefined);
    hashPassword.mockResolvedValue('hashed');
    headersGet.mockReturnValue(null);
    verifyPassword.mockResolvedValue({ ok: true, needsRehash: false });
    findFirst.mockResolvedValue(activeUser);
  });

  describe('user enumeration', () => {
    test('an unknown identifier and a wrong password answer identically', async () => {
      findFirst.mockResolvedValue(undefined);
      const unknown = await loginAction(credentials());

      findFirst.mockResolvedValue(activeUser);
      verifyPassword.mockResolvedValue({ ok: false });
      const wrongPassword = await loginAction(credentials());

      expect(unknown).toEqual({
        error: true,
        message: 'Invalid email/contact or password',
      });
      // The whole point: byte-identical, not merely similar.
      expect(unknown).toEqual(wrongPassword);
    });

    test('an unknown identifier pays the same bcrypt cost as a real check', async () => {
      findFirst.mockResolvedValue(undefined);

      const { default: bcrypt } = await import('bcryptjs');
      const compare = vi.spyOn(bcrypt, 'compare');

      await loginAction(credentials());

      // Two, not one. verifyPassword compares twice on every path, so a single
      // comparison here would make "no such account" measurably faster than a
      // wrong password against a legacy account and leak existence by timing.
      expect(compare).toHaveBeenCalledTimes(2);

      compare.mockRestore();
    });

    test('a hashing failure at import answers like a wrong password', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Re-imported so the module-level dummy hash is computed from a rejecting
      // hashPassword — an unparseable BCRYPT_ROUNDS, say.
      vi.resetModules();
      hashPassword.mockRejectedValue(
        new Error('bcrypt rounds are not a number')
      );

      const { loginAction: freshLoginAction } = await import(
        '@/features/auth/actions/auth'
      );

      findFirst.mockResolvedValue(undefined);

      // Left to escape, this branch would return a generic failure while a
      // wrong password still returned the shared message — a cleaner existence
      // oracle than the timing the dummy hash exists to hide.
      expect(await freshLoginAction(credentials())).toEqual({
        error: true,
        message: 'Invalid email/contact or password',
      });

      consoleError.mockRestore();
    });

    test('a wrong password on an inactive account is indistinguishable', async () => {
      findFirst.mockResolvedValue({ ...activeUser, active: false });
      verifyPassword.mockResolvedValue({ ok: false });

      expect(await loginAction(credentials())).toEqual({
        error: true,
        message: 'Invalid email/contact or password',
      });
    });
  });

  test('a correct password on an inactive account reports the deactivation', async () => {
    findFirst.mockResolvedValue({ ...activeUser, active: false });
    verifyPassword.mockResolvedValue({ ok: true, needsRehash: false });

    const result = await loginAction(credentials());

    expect(result).toEqual({ error: true, message: 'Account is deactivated' });
    // The active check runs after verification, so no session is issued.
    expect(createSession).not.toHaveBeenCalled();
  });

  describe('throttling', () => {
    test('refuses once the account is throttled, before any password check', async () => {
      isThrottled.mockResolvedValue({
        throttled: true,
        retryAfter: new Date(Date.now() + 8 * 60 * 1000),
      });

      const result = await loginAction(credentials());

      expect(result.error).toBe(true);
      expect(result.message).toMatch(/^Too many failed sign-in attempts/);
      expect(result.message).toContain('8 minutes');
      expect(verifyPassword).not.toHaveBeenCalled();
    });

    test('a refusal is not recorded, so retrying cannot extend the block', async () => {
      isThrottled.mockResolvedValue({
        throttled: true,
        retryAfter: new Date(Date.now() + 8 * 60 * 1000),
      });

      await loginAction(credentials());

      // isThrottled reads retryAfter off the row at `count - LIMIT`, so every
      // extra row pushes it later: recording refusals meant the window only
      // expired for a caller who stopped following its own advice.
      expect(recordLoginAttempt).not.toHaveBeenCalled();
    });

    test('does not refuse while under the threshold', async () => {
      isThrottled.mockResolvedValue({ throttled: false, retryAfter: null });

      const result = await loginAction(credentials());

      expect(result.error).toBe(false);
      expect(createSession).toHaveBeenCalledWith('user-1', {
        policyCompliant: true,
      });
    });

    test('keys on the normalized identifier, so casing shares one budget', async () => {
      await loginAction(credentials({ userName: '  JANE@Example.COM  ' }));

      // loginSchema trims and lowercases before anything sees it, so a varied
      // capitalization cannot buy a fresh budget.
      expect(isThrottled).toHaveBeenCalledWith(
        ['jane@example.com', '0700000000'],
        expect.any(Date)
      );
      expect(recordLoginAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: 'jane@example.com' })
      );
    });

    test('email and contact share one budget for the same account', async () => {
      await loginAction(credentials({ userName: '0700000000' }));

      // Counting the submitted string alone gave an account reachable both
      // ways two independent budgets — ten tries per window, not five.
      expect(isThrottled).toHaveBeenCalledWith(
        ['0700000000', 'jane@example.com'],
        expect.any(Date)
      );
    });

    test('an unknown identifier is throttled on its own', async () => {
      findFirst.mockResolvedValue(undefined);

      await loginAction(credentials({ userName: 'nobody@example.com' }));

      expect(isThrottled).toHaveBeenCalledWith(
        ['nobody@example.com'],
        expect.any(Date)
      );
    });

    test('a failed attempt is recorded against the resolved user', async () => {
      verifyPassword.mockResolvedValue({ ok: false });

      await loginAction(credentials());

      expect(recordLoginAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ succeeded: false, userId: 'user-1' })
      );
      expect(clearLoginFailures).not.toHaveBeenCalled();
    });
  });

  test('a successful login records the success and clears prior failures', async () => {
    const result = await loginAction(credentials());

    expect(recordLoginAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ succeeded: true, userId: 'user-1' })
    );
    expect(clearLoginFailures).toHaveBeenCalledWith(
      ['jane@example.com', '0700000000'],
      expect.any(Date)
    );
    expect(result).toEqual({
      error: false,
      message: 'Signed in successfully',
      data: '/dashboard',
      redirectTo: '/dashboard',
    });
  });

  test('an audit-write failure does not deny a proved login', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    recordLoginAttempt.mockRejectedValue(new Error('connection terminated'));

    const result = await loginAction(credentials());

    // The credentials are already verified here. A failed audit write — an
    // unmigrated environment, a dropped connection — must not turn that into
    // 'Something went wrong'.
    expect(result.error).toBe(false);
    expect(createSession).toHaveBeenCalledWith('user-1', {
      policyCompliant: true,
    });

    consoleError.mockRestore();
  });

  test('a failure clearing the counter does not deny a proved login', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    clearLoginFailures.mockRejectedValue(new Error('connection terminated'));

    const result = await loginAction(credentials());

    expect(result.error).toBe(false);
    expect(createSession).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  test('captures the request context as audit fields only', async () => {
    headersGet.mockImplementation((name: string) =>
      name === 'x-forwarded-for'
        ? '203.0.113.7, 70.41.3.18'
        : 'Mozilla/5.0 (test)'
    );

    await loginAction(credentials());

    expect(recordLoginAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        ipAddress: '203.0.113.7',
        userAgent: 'Mozilla/5.0 (test)',
      })
    );
    // Nothing gates on it: the throttle sees only identifiers.
    expect(isThrottled).toHaveBeenCalledWith(
      ['jane@example.com', '0700000000'],
      expect.any(Date)
    );
  });
});
