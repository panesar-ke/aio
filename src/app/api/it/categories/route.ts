import { asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import type { Option } from '@/types/index.types';

import db from '@/drizzle/db';
import { itCategories } from '@/drizzle/schema';
import {
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET(): Promise<NextResponse> {
  try {
    await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'api' });

    const categories = await db
      .select({ id: itCategories.id, name: itCategories.name })
      .from(itCategories)
      .orderBy(asc(itCategories.name));
    const options: Array<Option> = categories.map(category => ({
      value: category.id,
      label: category.name,
    }));
    return NextResponse.json(options);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    console.log(error);
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
