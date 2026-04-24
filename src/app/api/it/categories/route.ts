import db from '@/drizzle/db';
import { NextResponse } from 'next/server';
import { itCategories } from '@/drizzle/schema';
import type { Option } from '@/types/index.types';
import { asc } from 'drizzle-orm';
import { requireAnyPermission } from '@/lib/permissions/guards';
import {
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/permissions/errors';

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
