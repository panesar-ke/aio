import { addMonths } from 'date-fns';
import { and, eq, gte, ilike, inArray, lt, or, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import db from '@/drizzle/db';
import {
  itBudgetLines,
  itBudgets,
  itCategories,
  itExpenses,
  itSubCategories,
} from '@/drizzle/schema';
import {
  getFinancialYearMonths,
  getFinancialYearStart,
} from '@/lib/helpers/dates';
import { dateFormat } from '@/lib/helpers/formatters';
import { requireAnyPermission } from '@/lib/permissions/guards';

function getFinancialYearBounds(financialYearStart: number) {
  const months = getFinancialYearMonths(financialYearStart);
  return {
    from: dateFormat(months[0].date),
    toExclusive: dateFormat(addMonths(months[0].date, 12)),
  };
}

export async function getBudgets({
  search,
  financialYearStart,
}: {
  search?: string;
  financialYearStart?: number;
} = {}) {
  await requireAnyPermission(['it:admin', 'it:standard']);
  const fyStart = financialYearStart ?? getFinancialYearStart();

  const rows = await db
    .select({
      id: itBudgets.id,
      financialYearStart: itBudgets.financialYearStart,
      subCategoryId: itBudgets.subCategoryId,
      subCategory: itSubCategories.name,
      category: itCategories.name,
      totalBudgeted: sql<string>`COALESCE(SUM(${itBudgetLines.amount}), 0)`,
    })
    .from(itBudgets)
    .innerJoin(
      itSubCategories,
      eq(itBudgets.subCategoryId, itSubCategories.id),
    )
    .innerJoin(itCategories, eq(itSubCategories.categoryId, itCategories.id))
    .leftJoin(itBudgetLines, eq(itBudgetLines.budgetId, itBudgets.id))
    .where(
      and(
        eq(itBudgets.financialYearStart, fyStart),
        search
          ? or(
              ilike(itSubCategories.name, `%${search}%`),
              ilike(itCategories.name, `%${search}%`),
            )
          : undefined,
      ),
    )
    .groupBy(itBudgets.id, itSubCategories.name, itCategories.name)
    .orderBy(itCategories.name, itSubCategories.name);

  const actuals = await getBudgetActualsTotals(
    fyStart,
    rows.map(row => row.subCategoryId),
  );

  return rows.map(row => {
    const totalBudgeted = Number(row.totalBudgeted);
    const totalActual = actuals.get(row.subCategoryId) ?? 0;

    return {
      ...row,
      totalBudgeted,
      totalActual,
      variance: totalBudgeted - totalActual,
    };
  });
}

export async function getBudgetLinesByFinancialYear(
  financialYearStart: number,
) {
  await requireAnyPermission(['it:admin', 'it:standard']);

  const rows = await db
    .select({
      subCategoryId: itBudgets.subCategoryId,
      monthDate: itBudgetLines.monthDate,
      amount: itBudgetLines.amount,
    })
    .from(itBudgets)
    .innerJoin(itBudgetLines, eq(itBudgetLines.budgetId, itBudgets.id))
    .where(eq(itBudgets.financialYearStart, financialYearStart));

  const bySubCategory = new Map<string, Map<string, number>>();

  for (const row of rows) {
    if (!bySubCategory.has(row.subCategoryId)) {
      bySubCategory.set(row.subCategoryId, new Map());
    }
    bySubCategory.get(row.subCategoryId)?.set(row.monthDate, Number(row.amount));
  }

  return bySubCategory;
}

export async function getBudgetById(id: string) {
  await requireAnyPermission(['it:admin', 'it:standard']);

  const budget = await db.query.itBudgets.findFirst({
    where: (model, { eq }) => eq(model.id, id),
    with: {
      subCategory: { with: { itCategory: true } },
      lines: { orderBy: (line, { asc }) => asc(line.monthDate) },
    },
  });

  if (!budget) notFound();

  return budget;
}

export async function getBudgetActualsTotals(
  financialYearStart: number,
  subCategoryIds: Array<string>,
) {
  await requireAnyPermission(['it:admin', 'it:standard']);

  if (subCategoryIds.length === 0) return new Map<string, number>();

  const { from, toExclusive } = getFinancialYearBounds(financialYearStart);

  const rows = await db
    .select({
      subCategoryId: itExpenses.subCategoryId,
      total: sql<string>`SUM(${itExpenses.amount})`,
    })
    .from(itExpenses)
    .where(
      and(
        inArray(itExpenses.subCategoryId, subCategoryIds),
        gte(itExpenses.expenseDate, from),
        lt(itExpenses.expenseDate, toExclusive),
      ),
    )
    .groupBy(itExpenses.subCategoryId);

  return new Map(rows.map(row => [row.subCategoryId, Number(row.total)]));
}

export async function getBudgetActualsByMonth(
  financialYearStart: number,
  subCategoryId: string,
) {
  await requireAnyPermission(['it:admin', 'it:standard']);

  const months = getFinancialYearMonths(financialYearStart);
  const { from, toExclusive } = getFinancialYearBounds(financialYearStart);

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${itExpenses.expenseDate}::date), 'YYYY-MM-DD')`,
      total: sql<string>`SUM(${itExpenses.amount})`,
    })
    .from(itExpenses)
    .where(
      and(
        eq(itExpenses.subCategoryId, subCategoryId),
        gte(itExpenses.expenseDate, from),
        lt(itExpenses.expenseDate, toExclusive),
      ),
    )
    .groupBy(sql`date_trunc('month', ${itExpenses.expenseDate}::date)`);

  const totalsByMonth = new Map(
    rows.map(row => [row.month, Number(row.total)]),
  );

  return months.map(month => {
    const monthDate = dateFormat(month.date);
    return {
      monthDate,
      label: month.label,
      actual: totalsByMonth.get(monthDate) ?? 0,
    };
  });
}
