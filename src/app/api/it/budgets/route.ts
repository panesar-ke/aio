import { type NextRequest, NextResponse } from 'next/server';

import { getBudgets } from '@/features/it/services/budgets/data';
import { budgetsSearchParamsSchema } from '@/features/it/utils/budgets/schemas';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'api' });
    const searchParams = request.nextUrl.searchParams;
    const results = budgetsSearchParamsSchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!results.success) {
      return NextResponse.json(
        { message: 'Invalid search parameters' },
        { status: 422 },
      );
    }

    const { search, financialYearStart } = results.data;

    const result = await getBudgets({
      search: search ?? undefined,
      financialYearStart: financialYearStart
        ? Number(financialYearStart)
        : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    console.error(error);
    return NextResponse.json(
      { message: 'Failed to fetch budgets' },
      { status: 500 },
    );
  }
}
