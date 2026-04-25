import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import db from '@/drizzle/db';
import {
  itCategories,
  itExpenses,
  itSubCategories,
  vendors,
} from '@/drizzle/schema';
import { expensesSearchParamsSchema } from '@/features/it/utils/expenses/schemas';
import { getFinancialYearRanges } from '@/lib/helpers/dates';
import { dateFormat } from '@/lib/helpers/formatters';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'api' });
    const searchParams = request.nextUrl.searchParams;
    const results = expensesSearchParamsSchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );
    if (!results.success) {
      return NextResponse.json(
        { message: 'Invalid search parameters' },
        { status: 422 },
      );
    }

    const { from, search, to } = results.data;

    const {
      currentYear: { from: currentYearFrom, to: currentYearTo },
    } = getFinancialYearRanges();
    const filters: Array<SQL> = [];

    if (to && from) {
      filters.push(
        gte(itExpenses.expenseDate, from),
        lte(itExpenses.expenseDate, to),
      );
    } else {
      filters.push(
        gte(itExpenses.expenseDate, dateFormat(currentYearFrom)),
        lte(itExpenses.expenseDate, dateFormat(currentYearTo)),
      );
    }

    if (search) {
      const searchFilters = or(
        ilike(itExpenses.title, `%${search}%`),
        ilike(itExpenses.referenceNo, `%${search}%`),
        ilike(itExpenses.description, `%${search}%`),
        ilike(vendors.vendorName, `%${search}%`),
        ilike(itCategories.name, `%${search}%`),
        ilike(itSubCategories.name, `%${search}%`),
        ilike(sql`CAST(${itExpenses.amount} AS TEXT)`, `%${search}%`),
      );
      if (searchFilters) filters.push(searchFilters);
    }

    const result = await db
      .select({
        id: itExpenses.id,
        expenseDate: itExpenses.expenseDate,
        title: itExpenses.title,
        amount: itExpenses.amount,
        referenceNo: itExpenses.referenceNo,
        vendor: vendors.vendorName,
        category: itCategories.name,
        subCategory: itSubCategories.name,
      })
      .from(itExpenses)
      .innerJoin(vendors, eq(vendors.id, itExpenses.vendorId))
      .innerJoin(itCategories, eq(itCategories.id, itExpenses.categoryId))
      .innerJoin(
        itSubCategories,
        eq(itSubCategories.id, itExpenses.subCategoryId),
      )
      .where(and(...filters))
      .orderBy(desc(itExpenses.expenseDate));

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
      { message: 'Failed to fetch expenses' },
      { status: 500 },
    );
  }
}
