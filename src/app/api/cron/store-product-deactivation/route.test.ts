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

describe('GET /api/cron/store-product-deactivation', () => {
  it('returns 401 for an invalid bearer token', async () => {
    const request = new NextRequest(
      'https://example.com/api/cron/store-product-deactivation',
      { headers: { authorization: 'Bearer wrong' } },
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
