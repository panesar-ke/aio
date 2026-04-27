import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import db from '@/drizzle/db';
import {
  departments,
  itAssetCategories,
  itAssetAssignments,
  itAssets,
  users,
  vendors,
} from '@/drizzle/schema';
import { requireAnyPermission } from '@/lib/permissions/guards';
import type { Option } from '@/types/index.types';

export async function getAssetCategories() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  return db
    .select({
      id: itAssetCategories.id,
      name: itAssetCategories.name,
      description: itAssetCategories.description,
    })
    .from(itAssetCategories)
    .orderBy(asc(sql`lower(${itAssetCategories.name})`));
}

export async function getAssetById(id: string) {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const asset = await db.query.itAssets.findFirst({
    where: eq(itAssets.id, id),
  });

  if (!asset) {
    notFound();
  }

  return asset;
}

export async function getAssetAssignmentHistoryByAssetId(assetId: string) {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  return db
    .select({
      id: itAssetAssignments.id,
      userId: itAssetAssignments.userId,
      userName: users.name,
      assignedDate: itAssetAssignments.assignedDate,
      returnedDate: itAssetAssignments.returnedDate,
      assignmentNotes: itAssetAssignments.assignmentNotes,
      createdAt: itAssetAssignments.createdAt,
    })
    .from(itAssetAssignments)
    .leftJoin(users, eq(users.id, itAssetAssignments.userId))
    .where(eq(itAssetAssignments.assetId, assetId))
    .orderBy(sql`${itAssetAssignments.assignedDate} desc`);
}

export async function getAssetFormDependencies() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const [categories, vendorRows, departmentRows] = await Promise.all([
    getAssetCategories(),
    db
      .select({
        value: vendors.id,
        label: sql<string>`upper(${vendors.vendorName})`,
      })
      .from(vendors)
      .orderBy(asc(sql`lower(${vendors.vendorName})`)),
    db
      .select({
        value: sql<string>`${departments.id}::text`,
        label: departments.departmentName,
      })
      .from(departments)
      .orderBy(asc(sql`lower(${departments.departmentName})`)),
  ]);

  return {
    categories,
    vendors: vendorRows as Array<Option>,
    departments: departmentRows as Array<Option>,
  };
}

export async function getAssignableUsers() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const rows = await db
    .select({
      value: users.id,
      label: sql<string>`upper(${users.name})`,
    })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(asc(sql`lower(${users.name})`));

  return rows as Array<Option>;
}

export async function getAssignableAssets() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const rows = await db
    .select({
      value: itAssets.id,
      label: sql<string>`upper(${itAssets.name})`,
    })
    .from(itAssets)
    .where(
      and(
        ne(itAssets.status, 'retired'),
        ne(itAssets.status, 'disposed'),
      ),
    )
    .orderBy(asc(sql`lower(${itAssets.name})`));

  return rows as Array<Option>;
}
