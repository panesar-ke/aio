import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';

import db from '@/drizzle/db';
import {
  itBudgetLines,
  itBudgets,
  itCategories,
  itExpenses,
  itSubCategories,
  vendors,
} from '@/drizzle/schema';
import {
  calculateAverageMonthlySpend,
  type DashboardPeriod,
  type DashboardPeriodRange,
  getFinancialYearMonthsForPeriod,
} from '@/lib/helpers/dates';
import { calculatePercentDelta, dateFormat } from '@/lib/helpers/formatters';
import { requireAnyPermission } from '@/lib/permissions/guards';

export type CategoryRollupRow = {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  actual: number;
  /**
   * Stable position in the canonical (alphabetical) category order, used to
   * assign a consistent color wherever a category is displayed — even when
   * a widget re-sorts its own copy of the rows (e.g. by spend amount).
   */
  colorIndex: number;
};

/**
 * Actual and budgeted totals per top-level category for the given range.
 * Actual is rolled up directly from itExpenses.categoryId (present on every
 * expense row); budgeted is rolled up via itSubCategories, since itBudgets
 * is only ever attached to a sub-category in this schema (subCategoryId is
 * required), so there is no parent/child budget row to double-count.
 * Shared by the KPI cards, By Category chart, and Budget Tracker so the
 * period filter only needs to be applied once per page render.
 */
export async function getCategoryRollup(
  range: DashboardPeriodRange,
): Promise<Array<CategoryRollupRow>> {
  await requireAnyPermission(['it:admin', 'it:standard']);

  const from = dateFormat(range.from);
  const toExclusive = dateFormat(range.toExclusive);

  const [categories, actualRows, budgetedRows] = await Promise.all([
    db.query.itCategories.findMany({ columns: { id: true, name: true } }),
    db
      .select({
        categoryId: itExpenses.categoryId,
        total: sql<string>`SUM(${itExpenses.amount})`,
      })
      .from(itExpenses)
      .where(
        and(
          gte(itExpenses.expenseDate, from),
          lt(itExpenses.expenseDate, toExclusive),
        ),
      )
      .groupBy(itExpenses.categoryId),
    db
      .select({
        categoryId: itCategories.id,
        total: sql<string>`SUM(${itBudgetLines.amount})`,
      })
      .from(itBudgetLines)
      .innerJoin(itBudgets, eq(itBudgets.id, itBudgetLines.budgetId))
      .innerJoin(
        itSubCategories,
        eq(itSubCategories.id, itBudgets.subCategoryId),
      )
      .innerJoin(itCategories, eq(itCategories.id, itSubCategories.categoryId))
      .where(
        and(
          eq(itBudgets.financialYearStart, range.financialYearStart),
          gte(itBudgetLines.monthDate, from),
          lt(itBudgetLines.monthDate, toExclusive),
        ),
      )
      .groupBy(itCategories.id),
  ]);

  const actualByCategory = new Map(
    actualRows.map(row => [row.categoryId, Number(row.total)]),
  );
  const budgetedByCategory = new Map(
    budgetedRows.map(row => [row.categoryId, Number(row.total)]),
  );

  return categories
    .map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      budgeted: budgetedByCategory.get(category.id) ?? 0,
      actual: actualByCategory.get(category.id) ?? 0,
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName))
    .map((row, index) => ({ ...row, colorIndex: index }));
}

/** Lightweight total-spent-only query, used for the comparison period. */
export async function getTotalSpent(
  range: DashboardPeriodRange,
): Promise<number> {
  await requireAnyPermission(['it:admin', 'it:standard']);

  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${itExpenses.amount}), 0)` })
    .from(itExpenses)
    .where(
      and(
        gte(itExpenses.expenseDate, dateFormat(range.from)),
        lt(itExpenses.expenseDate, dateFormat(range.toExclusive)),
      ),
    );

  return Number(row?.total ?? 0);
}

export type MonthlyOverviewPoint = {
  monthDate: string;
  label: string;
  spent: number;
  budget: number;
};

/** Spent vs budget per financial-year month covered by the period. */
export async function getMonthlyOverview(
  range: DashboardPeriodRange,
  period: DashboardPeriod,
  referenceDate: Date = new Date(),
): Promise<Array<MonthlyOverviewPoint>> {
  await requireAnyPermission(['it:admin', 'it:standard']);

  const months = getFinancialYearMonthsForPeriod(period, referenceDate);
  const from = dateFormat(range.from);
  const toExclusive = dateFormat(range.toExclusive);

  const [spentRows, budgetRows] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${itExpenses.expenseDate}::date), 'YYYY-MM-DD')`,
        total: sql<string>`SUM(${itExpenses.amount})`,
      })
      .from(itExpenses)
      .where(
        and(
          gte(itExpenses.expenseDate, from),
          lt(itExpenses.expenseDate, toExclusive),
        ),
      )
      .groupBy(sql`date_trunc('month', ${itExpenses.expenseDate}::date)`),
    db
      .select({
        month: itBudgetLines.monthDate,
        total: sql<string>`SUM(${itBudgetLines.amount})`,
      })
      .from(itBudgetLines)
      .innerJoin(itBudgets, eq(itBudgets.id, itBudgetLines.budgetId))
      .where(
        and(
          eq(itBudgets.financialYearStart, range.financialYearStart),
          gte(itBudgetLines.monthDate, from),
          lt(itBudgetLines.monthDate, toExclusive),
        ),
      )
      .groupBy(itBudgetLines.monthDate),
  ]);

  const spentByMonth = new Map(
    spentRows.map(row => [row.month, Number(row.total)]),
  );
  const budgetByMonth = new Map(
    budgetRows.map(row => [row.month, Number(row.total)]),
  );

  return months.map(month => {
    const monthDate = dateFormat(month.date);
    return {
      monthDate,
      label: month.label,
      spent: spentByMonth.get(monthDate) ?? 0,
      budget: budgetByMonth.get(monthDate) ?? 0,
    };
  });
}

export type RecentExpense = {
  id: string;
  title: string;
  vendor: string;
  category: string;
  subCategory: string;
  amount: number;
  expenseDate: string;
};

export async function getRecentExpenses(
  range: DashboardPeriodRange,
  limit = 7,
): Promise<Array<RecentExpense>> {
  await requireAnyPermission(['it:admin', 'it:standard']);

  const rows = await db
    .select({
      id: itExpenses.id,
      title: itExpenses.title,
      vendor: vendors.vendorName,
      category: itCategories.name,
      subCategory: itSubCategories.name,
      amount: itExpenses.amount,
      expenseDate: itExpenses.expenseDate,
    })
    .from(itExpenses)
    .innerJoin(vendors, eq(vendors.id, itExpenses.vendorId))
    .innerJoin(itCategories, eq(itCategories.id, itExpenses.categoryId))
    .innerJoin(
      itSubCategories,
      eq(itSubCategories.id, itExpenses.subCategoryId),
    )
    .where(
      and(
        gte(itExpenses.expenseDate, dateFormat(range.from)),
        lt(itExpenses.expenseDate, dateFormat(range.toExclusive)),
      ),
    )
    .orderBy(desc(itExpenses.expenseDate), desc(itExpenses.id))
    .limit(limit);

  return rows.map(row => ({ ...row, amount: Number(row.amount) }));
}

export type DashboardKpis = {
  totalSpent: number;
  totalSpentDeltaPct: number | null;
  totalBudget: number;
  remainingBudget: number;
  overBudgetCategories: Array<{ categoryName: string; overAmount: number }>;
  avgMonthlySpend: number;
  avgMonthlySpendDeltaPct: number | null;
};

/**
 * Pure computation from already-fetched data — no DB access — so every KPI
 * derives from the same single category rollup instead of each card running
 * its own conflicting query.
 */
export function buildDashboardKpis(
  categoryRollup: Array<CategoryRollupRow>,
  monthsInPeriod: number,
  comparisonTotalSpent: number,
  comparisonMonthsInPeriod: number,
): DashboardKpis {
  const totalSpent = categoryRollup.reduce((sum, row) => sum + row.actual, 0);
  const totalBudget = categoryRollup.reduce(
    (sum, row) => sum + row.budgeted,
    0,
  );

  const overBudgetCategories = categoryRollup
    .filter(row => row.actual > row.budgeted)
    .map(row => ({
      categoryName: row.categoryName,
      overAmount: row.actual - row.budgeted,
    }))
    .sort((a, b) => b.overAmount - a.overAmount);

  const avgMonthlySpend = calculateAverageMonthlySpend(
    totalSpent,
    monthsInPeriod,
  );
  const comparisonAvgMonthlySpend = calculateAverageMonthlySpend(
    comparisonTotalSpent,
    comparisonMonthsInPeriod,
  );

  return {
    totalSpent,
    totalSpentDeltaPct: calculatePercentDelta(totalSpent, comparisonTotalSpent),
    totalBudget,
    remainingBudget: totalBudget - totalSpent,
    overBudgetCategories,
    avgMonthlySpend,
    avgMonthlySpendDeltaPct: calculatePercentDelta(
      avgMonthlySpend,
      comparisonAvgMonthlySpend,
    ),
  };
}
