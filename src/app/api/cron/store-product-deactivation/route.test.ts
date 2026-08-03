import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/env/server', () => ({
  env: { CRON_SECRET: 'secret' },
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
    vi.mocked(deactivateAndLogStaleProducts).mockResolvedValueOnce(null);

    const request = new NextRequest(
      'https://example.com/api/cron/store-product-deactivation',
      { headers: { authorization: 'Bearer secret' } },
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      batchId: null,
      totalCount: 0,
      notifiedCount: 0,
    });
  });

  it('returns batch and notification counts after a successful run', async () => {
    vi.mocked(deactivateAndLogStaleProducts).mockResolvedValueOnce({
      batchId: 'batch-1',
      totalCount: 3,
    });
    vi.mocked(notifyStoreAdminsOfDeactivation).mockResolvedValueOnce({
      notifiedCount: 2,
    });

    const request = new NextRequest(
      'https://example.com/api/cron/store-product-deactivation',
      { headers: { authorization: 'Bearer secret' } },
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      batchId: 'batch-1',
      totalCount: 3,
      notifiedCount: 2,
    });
  });
});
