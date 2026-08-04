import { type NextRequest, NextResponse } from 'next/server';

import { env } from '@/env/server';
import { inngest } from '@/inngest/client';

function getCronSecret(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function GET(request: NextRequest) {
  if (!env.CRON_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { message: 'Server misconfigured: CRON_SECRET is not set' },
        { status: 500 },
      );
    }
  } else {
    const token = getCronSecret(request);
    if (!token || token !== env.CRON_SECRET) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  const requestId = crypto.randomUUID();

  try {
    await inngest.send({
      name: 'store/run.product-deactivation',
      data: {
        requestId,
        source: 'vercel-cron',
        triggeredAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      queued: true,
      requestId,
      source: 'vercel-cron',
      trigger: 'store/run.product-deactivation',
    });
  } catch (error) {
    console.error('Failed to queue store product deactivation job', {
      requestId,
      error,
    });

    return NextResponse.json(
      { message: 'Failed to queue product deactivation job' },
      { status: 500 },
    );
  }
}
