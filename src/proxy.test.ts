import { beforeEach, describe, expect, test, vi } from 'vitest';

const { arcjetMock, decryptMock, nextMock, protectMock, redirectMock } =
  vi.hoisted(() => ({
    arcjetMock: vi.fn(() => ({ protect: protectMock })),
    protectMock: vi.fn(),
    decryptMock: vi.fn(),
    nextMock: vi.fn(),
    redirectMock: vi.fn(),
  }));

vi.mock('@/env/server', () => ({
  env: {
    ARCJET_KEY: 'test-arcjet-key',
  },
}));

vi.mock('@arcjet/next', () => ({
  default: arcjetMock,
  detectBot: vi.fn(() => ({ type: 'detectBot' })),
  shield: vi.fn(() => ({ type: 'shield' })),
  slidingWindow: vi.fn(() => ({ type: 'slidingWindow' })),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    next: nextMock,
    redirect: redirectMock,
  },
}));

vi.mock('@/lib/session', () => ({
  decrypt: decryptMock,
}));

import proxy from '@/proxy';

function createRequest(pathname: string, session?: string) {
  const nextUrl = new URL(`https://example.com${pathname}`);

  return {
    cookies: {
      get: vi.fn((name: string) =>
        name === "session" && session ? { value: session } : undefined
      ),
    },
    nextUrl,
  };
}

describe('proxy session handling', () => {
  beforeEach(() => {
    protectMock.mockReset();
    decryptMock.mockReset();
    nextMock.mockReset();
    redirectMock.mockReset();

    protectMock.mockResolvedValue({
      isDenied: () => false,
      isErrored: () => false,
    });
    nextMock.mockReturnValue('next');
    redirectMock.mockReturnValue('redirect');
  });

  test('uses the validated sessionId for Arcjet and route gating', async () => {
    decryptMock.mockResolvedValue({
      sessionId: 'validated-session-id',
      userId: 'user-1',
    });

    const response = await proxy(
      createRequest('/dashboard', 'valid-cookie') as never
    );

    expect(decryptMock).toHaveBeenCalledWith('valid-cookie');
    expect(protectMock).toHaveBeenCalledWith(expect.anything(), {
      sessionId: 'validated-session-id',
    });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(response).toBe('next');
  });

  test('treats malformed session cookies as anonymous for Arcjet and auth', async () => {
    decryptMock.mockRejectedValue(new Error('bad cookie'));

    const response = await proxy(
      createRequest('/dashboard', 'malformed-cookie') as never
    );

    expect(protectMock).toHaveBeenCalledWith(expect.anything(), {
      sessionId: 'anonymous',
    });
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(response).toBe('redirect');
  });

  test('does not redirect authenticated users away from public routes on malformed cookies', async () => {
    decryptMock.mockRejectedValue(new Error('bad cookie'));

    const response = await proxy(
      createRequest('/login', 'malformed-cookie') as never
    );

    expect(protectMock).toHaveBeenCalledWith(expect.anything(), {
      sessionId: 'anonymous',
    });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(response).toBe('next');
  });

  test('treats a reset-password token URL as public', async () => {
    protectMock.mockResolvedValue({
      isDenied: () => false,
      isErrored: () => false,
    });
    nextMock.mockReturnValue('next');

    const result = await proxy(
      createRequest('/reset-password/AbC123-xyz') as never
    );

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe('next');
  });

  test('still redirects an unauthenticated protected route', async () => {
    protectMock.mockResolvedValue({
      isDenied: () => false,
      isErrored: () => false,
    });
    redirectMock.mockReturnValue('redirect');

    const result = await proxy(createRequest('/dashboard') as never);

    expect(redirectMock).toHaveBeenCalled();
    expect(result).toBe('redirect');
  });

  test('does not treat a lookalike prefix as public', async () => {
    protectMock.mockResolvedValue({
      isDenied: () => false,
      isErrored: () => false,
    });
    redirectMock.mockReturnValue('redirect');

    const result = await proxy(
      createRequest('/reset-password-admin') as never
    );

    expect(redirectMock).toHaveBeenCalled();
    expect(result).toBe('redirect');
  });

  test('redirects a non-compliant user to change-password after the deadline', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-01-01T00:00:00.000Z');
    protectMock.mockResolvedValue({
      isDenied: () => false,
      isErrored: () => false,
    });
    decryptMock.mockResolvedValue({
      userId: 'u1',
      sessionId: 's1',
      policyCompliant: false,
    });
    redirectMock.mockReturnValue('redirect');

    const result = await proxy(createRequest('/dashboard', 'cookie') as never);

    expect(redirectMock).toHaveBeenCalled();
    expect(String(redirectMock.mock.calls[0][0])).toContain('/change-password');
    expect(result).toBe('redirect');

    vi.unstubAllEnvs();
  });

  test('never gates the change-password page itself', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-01-01T00:00:00.000Z');
    protectMock.mockResolvedValue({
      isDenied: () => false,
      isErrored: () => false,
    });
    decryptMock.mockResolvedValue({
      userId: 'u1',
      sessionId: 's1',
      policyCompliant: false,
    });
    nextMock.mockReturnValue('next');

    const result = await proxy(
      createRequest('/change-password', 'cookie') as never
    );

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe('next');

    vi.unstubAllEnvs();
  });

  test('does not gate a compliant user after the deadline', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-01-01T00:00:00.000Z');
    protectMock.mockResolvedValue({
      isDenied: () => false,
      isErrored: () => false,
    });
    decryptMock.mockResolvedValue({
      userId: 'u1',
      sessionId: 's1',
      policyCompliant: true,
    });
    nextMock.mockReturnValue('next');

    const result = await proxy(createRequest('/dashboard', 'cookie') as never);

    expect(result).toBe('next');

    vi.unstubAllEnvs();
  });

  test('does not gate a non-compliant user when no deadline is set', async () => {
    protectMock.mockResolvedValue({
      isDenied: () => false,
      isErrored: () => false,
    });
    decryptMock.mockResolvedValue({
      userId: 'u1',
      sessionId: 's1',
      policyCompliant: false,
    });
    nextMock.mockReturnValue('next');

    const result = await proxy(createRequest('/dashboard', 'cookie') as never);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe('next');
  });

  test('lets a session issued before the policy through', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-01-01T00:00:00.000Z');
    protectMock.mockResolvedValue({
      isDenied: () => false,
      isErrored: () => false,
    });
    // No policyCompliant claim at all.
    decryptMock.mockResolvedValue({ userId: 'u1', sessionId: 's1' });
    nextMock.mockReturnValue('next');

    const result = await proxy(createRequest('/dashboard', 'cookie') as never);

    expect(result).toBe('next');

    vi.unstubAllEnvs();
  });
});

describe('proxy Arcjet decisions', () => {
  beforeEach(() => {
    protectMock.mockReset();
    decryptMock.mockReset();
    nextMock.mockReset();
    redirectMock.mockReset();

    decryptMock.mockRejectedValue(new Error('no cookie'));
    nextMock.mockReturnValue('next');
    redirectMock.mockReturnValue('redirect');
  });

  test('keys the rate limit on the client IP as well as the session', () => {
    // `ip.src` is Arcjet's own value rather than anything we pass, so the
    // characteristic list is the only place this is observable. Without it
    // every anonymous request shares one bucket keyed on the literal
    // 'anonymous', and one client can 403 sign-in company-wide.
    expect(arcjetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        characteristics: ['ip.src', 'sessionId'],
      })
    );
  });

  test('passes the session characteristic through to protect', async () => {
    decryptMock.mockResolvedValue({ sessionId: 's1', userId: 'u1' });
    protectMock.mockResolvedValue({
      isDenied: () => false,
      isErrored: () => false,
    });

    await proxy(createRequest('/dashboard', 'cookie') as never);

    expect(protectMock).toHaveBeenCalledWith(expect.anything(), {
      sessionId: 's1',
    });
  });

  test('allows the request when the decision errored', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    protectMock.mockResolvedValue({
      isDenied: () => true,
      isErrored: () => true,
      reason: { message: 'arcjet unreachable' },
    });

    // Public route, so an allowed request falls through to next() rather than
    // being redirected — isolating the decision branch from the auth gate.
    const result = await proxy(createRequest('/login') as never);

    expect(result).toBe('next');
    expect(consoleError).toHaveBeenCalledWith(
      'ARCJET_DECISION_ERROR',
      expect.objectContaining({ message: 'arcjet unreachable' })
    );

    consoleError.mockRestore();
  });

  test('refuses the request when the decision is denied', async () => {
    protectMock.mockResolvedValue({
      isDenied: () => true,
      isErrored: () => false,
      reason: { isRateLimit: () => false },
    });

    const result = (await proxy(createRequest('/login') as never)) as Response;

    expect(result.status).toBe(403);
    expect(nextMock).not.toHaveBeenCalled();
    // The body stays empty so a caller learns nothing about which rule fired.
    expect(await result.text()).toBe('');
    expect(result.headers.get('Retry-After')).toBeNull();
  });

  test('sends Retry-After when the denial is a rate limit', async () => {
    protectMock.mockResolvedValue({
      isDenied: () => true,
      isErrored: () => false,
      reason: {
        isRateLimit: () => true,
        reset: 42,
        resetTime: undefined,
      },
    });

    const result = (await proxy(createRequest('/login') as never)) as Response;

    expect(result.status).toBe(403);
    expect(result.headers.get('Retry-After')).toBe('42');
  });

  test('prefers resetTime over reset when computing Retry-After', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T00:00:00.000Z'));

    protectMock.mockResolvedValue({
      isDenied: () => true,
      isErrored: () => false,
      reason: {
        isRateLimit: () => true,
        reset: 999,
        resetTime: new Date('2026-09-10T00:00:30.000Z'),
      },
    });

    const result = (await proxy(createRequest('/login') as never)) as Response;

    expect(result.headers.get('Retry-After')).toBe('30');

    vi.useRealTimers();
  });
});
