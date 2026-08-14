import { beforeEach, describe, expect, test, vi } from 'vitest';

const { decryptMock, nextMock, protectMock, redirectMock } = vi.hoisted(() => ({
  protectMock: vi.fn(),
  decryptMock: vi.fn(),
  nextMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock('@arcjet/next', () => ({
  default: vi.fn(() => ({
    protect: protectMock,
  })),
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
    protectMock.mockResolvedValue({ isDenied: () => false });
    nextMock.mockReturnValue('next');

    const result = await proxy(
      createRequest('/reset-password/AbC123-xyz') as never
    );

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe('next');
  });

  test('still redirects an unauthenticated protected route', async () => {
    protectMock.mockResolvedValue({ isDenied: () => false });
    redirectMock.mockReturnValue('redirect');

    const result = await proxy(createRequest('/dashboard') as never);

    expect(redirectMock).toHaveBeenCalled();
    expect(result).toBe('redirect');
  });

  test('does not treat a lookalike prefix as public', async () => {
    protectMock.mockResolvedValue({ isDenied: () => false });
    redirectMock.mockReturnValue('redirect');

    const result = await proxy(
      createRequest('/reset-password-admin') as never
    );

    expect(redirectMock).toHaveBeenCalled();
    expect(result).toBe('redirect');
  });
});
