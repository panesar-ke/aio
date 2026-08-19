import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const deleteMock = vi.fn();
const whereMock = vi.fn();
const returningMock = vi.fn();
const ltMock = vi.fn();
const sessionsMock = {
  expiresAt: Symbol('expiresAt'),
  id: Symbol('id'),
};

function request(token?: string) {
  return new NextRequest('https://example.com/api/cron/daily', {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

async function loadRouteWithCronSecret(
  cronSecret?: string,
  options: {
    deleteResult?: Array<{ id: string }>;
    deleteError?: Error;
  } = {},
) {
  vi.resetModules();

  const { deleteResult = [], deleteError } = options;

  returningMock.mockImplementation(async () => {
    if (deleteError) {
      throw deleteError;
    }

    return deleteResult;
  });
  whereMock.mockReturnValue({ returning: returningMock });
  deleteMock.mockReturnValue({ where: whereMock });
  ltMock.mockImplementation((column, value) => ({ column, value }));

  vi.doMock('@/env/server', () => ({
    env: { CRON_SECRET: cronSecret },
  }));

  vi.doMock('@/drizzle/db', () => ({
    default: { delete: deleteMock },
  }));

  vi.doMock('@/drizzle/schema', () => ({
    sessions: sessionsMock,
  }));

  vi.doMock('drizzle-orm', () => ({
    lt: ltMock,
  }));

  return import('@/app/api/cron/daily/route');
}

describe('GET /api/cron/daily', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-19T12:00:00.000Z'));
  });

  afterEach(() => {
    deleteMock.mockReset();
    whereMock.mockReset();
    returningMock.mockReset();
    ltMock.mockReset();
    vi.clearAllMocks();
    vi.resetModules();
    vi.useRealTimers();
  });

  it('returns 500 when CRON_SECRET is not configured', async () => {
    const { GET } = await loadRouteWithCronSecret(undefined);

    const response = await GET(request());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Server misconfigured: CRON_SECRET is not set',
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the bearer token is missing', async () => {
    const { GET } = await loadRouteWithCronSecret('secret');

    const response = await GET(request());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: 'Unauthorized',
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the bearer token is invalid', async () => {
    const { GET } = await loadRouteWithCronSecret('secret');

    const response = await GET(request('wrong'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: 'Unauthorized',
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('deletes sessions older than 30 days past expiry and returns the count', async () => {
    const { GET } = await loadRouteWithCronSecret('secret', {
      deleteResult: [{ id: 'session-1' }, { id: 'session-2' }],
    });

    const response = await GET(request('secret'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: 2 });
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith(sessionsMock);
    expect(ltMock).toHaveBeenCalledTimes(1);
    expect(ltMock).toHaveBeenCalledWith(
      sessionsMock.expiresAt,
      new Date('2026-07-20T12:00:00.000Z'),
    );
    expect(whereMock).toHaveBeenCalledTimes(1);
    expect(whereMock).toHaveBeenCalledWith({
      column: sessionsMock.expiresAt,
      value: new Date('2026-07-20T12:00:00.000Z'),
    });
    expect(returningMock).toHaveBeenCalledWith({ id: sessionsMock.id });
  });

  it('returns 500 when deleting expired sessions fails', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { GET } = await loadRouteWithCronSecret('secret', {
      deleteError: new Error('db down'),
    });

    const response = await GET(request('secret'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Failed to delete old session files',
    });
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
