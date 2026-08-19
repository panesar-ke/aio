import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const deleteMock = vi.fn();

async function loadRouteWithCronSecret(cronSecret?: string) {
  vi.resetModules();

  vi.doMock('@/env/server', () => ({
    env: { CRON_SECRET: cronSecret },
  }));

  vi.doMock('@/drizzle/db', () => ({
    default: { delete: deleteMock },
  }));

  vi.doMock('@/drizzle/schema', () => ({
    sessions: {},
  }));

  return import('@/app/api/cron/daily/route');
}

describe('GET /api/cron/daily', () => {
  afterEach(() => {
    deleteMock.mockReset();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns 500 when CRON_SECRET is not configured', async () => {
    const { GET } = await loadRouteWithCronSecret(undefined);
    const request = new NextRequest('https://example.com/api/cron/daily');

    const response = await GET(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Server misconfigured: CRON_SECRET is not set',
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
