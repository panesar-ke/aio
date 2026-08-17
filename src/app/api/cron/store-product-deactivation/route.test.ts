import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/env/server', () => ({
  env: { CRON_SECRET: 'secret' },
}));

vi.mock('@/inngest/client', () => ({
  inngest: {
    send: vi.fn(),
  },
}));

vi.mock('@/features/store/services/product-deactivation/actions', () => ({
  deactivateAndLogStaleProducts: vi.fn(),
  notifyStoreAdminsOfDeactivation: vi.fn(),
}));

import { GET } from '@/app/api/cron/store-product-deactivation/route';
import {
  deactivateAndLogStaleProducts,
  notifyStoreAdminsOfDeactivation,
} from '@/features/store/services/product-deactivation/actions';
import { inngest } from '@/inngest/client';

describe('GET /api/cron/store-product-deactivation', () => {
  it('returns 401 for an invalid bearer token', async () => {
    const request = new NextRequest(
      'https://example.com/api/cron/store-product-deactivation',
      { headers: { authorization: 'Bearer wrong' } },
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns an empty result when no stale products are found', async () => {
    vi.mocked(inngest.send).mockResolvedValueOnce({
      ids: ['event-id'],
    } as Awaited<ReturnType<typeof inngest.send>>);

    const request = new NextRequest(
      'https://example.com/api/cron/store-product-deactivation',
      { headers: { authorization: 'Bearer secret' } },
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      queued: true,
      source: 'vercel-cron',
      trigger: 'store/run.product-deactivation',
      requestId: expect.any(String),
    });
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'store/run.product-deactivation',
        data: {
          requestId: expect.any(String),
          source: 'vercel-cron',
          triggeredAt: expect.any(String),
        },
      }),
    );
    expect(deactivateAndLogStaleProducts).not.toHaveBeenCalled();
    expect(notifyStoreAdminsOfDeactivation).not.toHaveBeenCalled();
  });

  it('returns 500 when the background job cannot be queued', async () => {
    vi.mocked(inngest.send).mockRejectedValueOnce(new Error('queue failed'));

    const request = new NextRequest(
      'https://example.com/api/cron/store-product-deactivation',
      { headers: { authorization: 'Bearer secret' } },
    );

    const response = await GET(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Failed to queue product deactivation job',
    });
  });
});
