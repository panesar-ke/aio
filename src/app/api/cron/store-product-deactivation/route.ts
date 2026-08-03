import { type NextRequest, NextResponse } from 'next/server';

import { env } from '@/env/server';
import {
  deactivateAndLogStaleProducts,
  notifyStoreAdminsOfDeactivation,
} from '@/features/store/services/product-deactivation/actions';

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

  const batch = await deactivateAndLogStaleProducts();

  if (!batch) {
    return NextResponse.json({
      batchId: null,
      totalCount: 0,
      notifiedCount: 0,
    });
  }

  const { notifiedCount } = await notifyStoreAdminsOfDeactivation(
    batch.batchId,
    batch.totalCount,
  );

  return NextResponse.json({
    batchId: batch.batchId,
    totalCount: batch.totalCount,
    notifiedCount,
  });
}
