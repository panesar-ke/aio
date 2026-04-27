import { asc, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import type { Option } from '@/types/index.types';

import db from '@/drizzle/db';
import { itAssetCategories } from '@/drizzle/schema';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET(): Promise<NextResponse> {
  try {
    await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'api' });

    const categories = await db
      .select({
        value: itAssetCategories.id,
        label: itAssetCategories.name,
      })
      .from(itAssetCategories)
      .orderBy(asc(sql`lower(${itAssetCategories.name})`));

    return NextResponse.json(categories as Array<Option>);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    console.log(error);
    return NextResponse.json(
      { message: 'Failed to fetch asset categories' },
      { status: 500 },
    );
  }
}
