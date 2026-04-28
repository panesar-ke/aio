import { and, desc, eq, gte, ilike, lte, or, type SQL } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import db from '@/drizzle/db';
import { departments, itAssetAssignments, itAssets, users } from '@/drizzle/schema';
import { assetAssignmentsSearchParamsSchema } from '@/features/it/assets/utils/schemas';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'api' });
    const searchParams = request.nextUrl.searchParams;
    const results = assetAssignmentsSearchParamsSchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!results.success) {
      return NextResponse.json(
        { message: 'Invalid search parameters' },
        { status: 422 },
      );
    }

    const { assetId, custodyType, departmentId, from, search, to, userId } =
      results.data;
    const filters: Array<SQL> = [];

    if (from && to) {
      filters.push(
        gte(itAssetAssignments.assignedDate, from),
        lte(itAssetAssignments.assignedDate, to),
      );
    }

    if (assetId) {
      filters.push(eq(itAssetAssignments.assetId, assetId));
    }

    if (userId) {
      filters.push(eq(itAssetAssignments.userId, userId));
    }

    if (departmentId) {
      filters.push(eq(itAssetAssignments.departmentId, Number(departmentId)));
    }

    if (custodyType) {
      filters.push(
        eq(itAssetAssignments.assetAssignmentCustodyType, custodyType),
      );
    }

    if (search) {
      const searchFilters = or(
        ilike(itAssets.name, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(departments.departmentName, `%${search}%`),
        ilike(itAssetAssignments.assignmentNotes, `%${search}%`),
      );
      if (searchFilters) filters.push(searchFilters);
    }

    const result = await db
      .select({
        id: itAssetAssignments.id,
        assetId: itAssetAssignments.assetId,
        assetName: itAssets.name,
        assetAssignmentCustodyType: itAssetAssignments.assetAssignmentCustodyType,
        userId: itAssetAssignments.userId,
        userName: users.name,
        departmentId: itAssetAssignments.departmentId,
        departmentName: departments.departmentName,
        assignedDate: itAssetAssignments.assignedDate,
        returnedDate: itAssetAssignments.returnedDate,
        assignmentNotes: itAssetAssignments.assignmentNotes,
      })
      .from(itAssetAssignments)
      .innerJoin(itAssets, eq(itAssets.id, itAssetAssignments.assetId))
      .leftJoin(users, eq(users.id, itAssetAssignments.userId))
      .leftJoin(departments, eq(departments.id, itAssetAssignments.departmentId))
      .where(and(...filters))
      .orderBy(desc(itAssetAssignments.assignedDate));

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
      { message: 'Failed to fetch asset assignments' },
      { status: 500 },
    );
  }
}
