import db from '@/drizzle/db';
import { NextResponse } from 'next/server';
import { itCategories } from '@/drizzle/schema';
import type { Option } from '@/types/index.types';
import { asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
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
    console.log(error);
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 },
    );
  }
}
