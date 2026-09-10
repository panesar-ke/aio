import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  clearLoginFailures,
  createNotification,
  createSession,
  findFirst,
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
  hashPassword: vi.fn(async () => 'hashed'),
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

    test('an unknown identifier still pays the bcrypt cost', async () => {
      findFirst.mockResolvedValue(undefined);

      const { default: bcrypt } = await import('bcryptjs');
      const compare = vi.spyOn(bcrypt, 'compare');

      await loginAction(credentials());

      // Skipping this is what made "no such account" measurably faster to
      // return and leaked account existence by timing.
      expect(compare).toHaveBeenCalled();

      compare.mockRestore();
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
    test('refuses once the identifier is throttled, before any lookup', async () => {
      isThrottled.mockResolvedValue({
        throttled: true,
        retryAfter: new Date(Date.now() + 8 * 60 * 1000),
      });

      const result = await loginAction(credentials());

      expect(result.error).toBe(true);
      expect(result.message).toMatch(/^Too many failed sign-in attempts/);
      expect(result.message).toContain('8 minutes');
      // Never reaches the users table.
      expect(findFirst).not.toHaveBeenCalled();
      expect(verifyPassword).not.toHaveBeenCalled();
      // The refusal is itself recorded.
      expect(recordLoginAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'jane@example.com',
          succeeded: false,
        })
      );
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
        'jane@example.com',
        expect.any(Date)
      );
      expect(recordLoginAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: 'jane@example.com' })
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
    expect(clearLoginFailures).toHaveBeenCalledWith('jane@example.com');
    expect(result).toEqual({
      error: false,
      message: 'Signed in successfully',
      data: '/dashboard',
      redirectTo: '/dashboard',
    });
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
    // Nothing gates on it: the throttle sees only the identifier.
    expect(isThrottled).toHaveBeenCalledWith(
      'jane@example.com',
      expect.any(Date)
    );
  });
});
