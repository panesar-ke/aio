import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import db from '@/drizzle/db';
import { itExpenses } from '@/drizzle/schema';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function getCategories() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const result = await db.query.itCategories.findMany({
    columns: {
      id: true,
      name: true,
    },
  });
  return result;
}

export async function getSubCategories() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const result = await db.query.itSubCategories.findMany();
  return result.map(({ id, name, categoryId }) => ({ id, name, categoryId }));
}

export async function getExpenseById(id: string) {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const result = await db.query.itExpenses.findFirst({
    columns: { createdAt: false },
    where: eq(itExpenses.id, id),
  });

  if (!result) notFound();

  return result;
}
