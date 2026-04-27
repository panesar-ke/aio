import { and, desc, eq, gte, ilike, lte, or, type SQL } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import db from '@/drizzle/db';
import {
  departments,
  itAssetCategories,
  itAssets,
  users,
  vendors,
} from '@/drizzle/schema';
import { assetsSearchParamsSchema } from '@/features/it/assets/utils/schemas';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'api' });
    const searchParams = request.nextUrl.searchParams;
    const results = assetsSearchParamsSchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!results.success) {
      return NextResponse.json(
        { message: 'Invalid search parameters' },
        { status: 422 },
      );
    }

    const { categoryId, condition, departmentId, from, search, status, to } =
      results.data;
    const filters: Array<SQL> = [];

    if (from && to) {
      filters.push(
        gte(itAssets.purchaseDate, from),
        lte(itAssets.purchaseDate, to),
      );
    }

    if (status) {
      filters.push(eq(itAssets.status, status));
    }

    if (condition) {
      filters.push(eq(itAssets.condition, condition));
    }

    if (categoryId) {
      filters.push(eq(itAssets.categoryId, categoryId));
    }

    if (departmentId) {
      filters.push(eq(itAssets.departmentId, departmentId));
    }

    if (search) {
      const searchFilters = or(
        ilike(itAssets.name, `%${search}%`),
        ilike(itAssets.brand, `%${search}%`),
        ilike(itAssets.model, `%${search}%`),
        ilike(itAssets.serialNumber, `%${search}%`),
        ilike(vendors.vendorName, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(departments.departmentName, `%${search}%`),
        ilike(itAssetCategories.name, `%${search}%`),
      );

      if (searchFilters) filters.push(searchFilters);
    }

    const result = await db
      .select({
        id: itAssets.id,
        name: itAssets.name,
        category: itAssetCategories.name,
        brand: itAssets.brand,
        model: itAssets.model,
        serialNumber: itAssets.serialNumber,
        purchaseDate: itAssets.purchaseDate,
        purchaseCost: itAssets.purchaseCost,
        status: itAssets.status,
        condition: itAssets.condition,
        department: departments.departmentName,
        assignedUser: users.name,
        vendor: vendors.vendorName,
      })
      .from(itAssets)
      .innerJoin(
        itAssetCategories,
        eq(itAssetCategories.id, itAssets.categoryId),
      )
      .leftJoin(vendors, eq(vendors.id, itAssets.vendorId))
      .leftJoin(departments, eq(departments.id, itAssets.departmentId))
      .leftJoin(users, eq(users.id, itAssets.currentAssignedUserId))
      .where(and(...filters))
      .orderBy(desc(itAssets.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    console.log(error);
    return NextResponse.json(
      { message: 'Failed to fetch assets' },
      { status: 500 },
    );
  }
}
