import { NextResponse } from 'next/server';

import { getRecentImportBatches } from '@/features/procurement/services/products-import/data';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET() {
  try {
    await requireAnyPermission(
      ['procurement:admin', 'procurement:standard', 'store:admin', 'store:standard'],
      { mode: 'api' },
    );

    const batches = await getRecentImportBatches();
    return NextResponse.json({ batches });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Failed to load import batches' }, { status: 500 });
  }
}
