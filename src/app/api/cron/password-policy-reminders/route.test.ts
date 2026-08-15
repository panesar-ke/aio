import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/env/server', () => ({
  env: { CRON_SECRET: 'secret' },
}));

vi.mock('@/features/auth/services/data', () => ({
  findUsersNeedingPolicyReminder: vi.fn(),
}));

vi.mock('@/features/global/services/actions', () => ({
  createNotification: vi.fn(),
}));

import { GET } from '@/app/api/cron/password-policy-reminders/route';
import { findUsersNeedingPolicyReminder } from '@/features/auth/services/data';
import { createNotification } from '@/features/global/services/actions';

function request(token = 'secret') {
  return new NextRequest(
    'https://example.com/api/cron/password-policy-reminders',
    { headers: { authorization: `Bearer ${token}` } },
  );
}

describe('GET /api/cron/password-policy-reminders', () => {
  beforeEach(() => {
    vi.mocked(findUsersNeedingPolicyReminder).mockReset();
    vi.mocked(createNotification).mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('rejects an invalid bearer token', async () => {
    const response = await GET(request('wrong'));

    expect(response.status).toBe(401);
    expect(findUsersNeedingPolicyReminder).not.toHaveBeenCalled();
  });

  it('does nothing when no deadline is configured', async () => {
    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 0,
      skipped: 'outside-window',
    });
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('does nothing while the deadline is more than a week out', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-11-20T00:00:00.000Z');

    const response = await GET(request());

    await expect(response.json()).resolves.toEqual({
      notified: 0,
      skipped: 'outside-window',
    });
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('does nothing once the deadline has passed', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-10-19T00:00:00.000Z');

    const response = await GET(request());

    await expect(response.json()).resolves.toEqual({
      notified: 0,
      skipped: 'outside-window',
    });
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('notifies every affected user inside the final week', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-10-25T00:00:00.000Z');
    vi.mocked(findUsersNeedingPolicyReminder).mockResolvedValue([
      { id: 'user-1' },
      { id: 'user-2' },
    ]);

    const response = await GET(request());

    await expect(response.json()).resolves.toEqual({ notified: 2, days: 5 });
    expect(createNotification).toHaveBeenCalledTimes(2);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        notificationType: 'PASSWORD_POLICY',
        path: '/change-password',
        eventId: 'reminder-2026-10-25T00:00:00.000Z',
      }),
    );
  });

  it('reports a failure instead of pretending it notified', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-10-25T00:00:00.000Z');
    vi.mocked(findUsersNeedingPolicyReminder).mockRejectedValue(
      new Error('db down'),
    );

    const response = await GET(request());

    expect(response.status).toBe(500);
  });
});
