import { desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import db from '@/drizzle/db';
import { departments, itAssetAssignments, users } from '@/drizzle/schema';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

type Params = Promise<{ assetId: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params },
) {
  try {
    await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'api' });
    const { assetId } = await params;

    const result = await db
      .select({
        id: itAssetAssignments.id,
        assetId: itAssetAssignments.assetId,
        assetAssignmentCustodyType: itAssetAssignments.assetAssignmentCustodyType,
        userId: itAssetAssignments.userId,
        userName: users.name,
        departmentId: itAssetAssignments.departmentId,
        departmentName: departments.departmentName,
        assignedDate: itAssetAssignments.assignedDate,
        returnedDate: itAssetAssignments.returnedDate,
        assignmentNotes: itAssetAssignments.assignmentNotes,
        createdAt: itAssetAssignments.createdAt,
      })
      .from(itAssetAssignments)
      .leftJoin(users, eq(users.id, itAssetAssignments.userId))
      .leftJoin(departments, eq(departments.id, itAssetAssignments.departmentId))
      .where(eq(itAssetAssignments.assetId, assetId))
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
      { message: 'Failed to fetch asset assignment history' },
      { status: 500 },
    );
  }
}
