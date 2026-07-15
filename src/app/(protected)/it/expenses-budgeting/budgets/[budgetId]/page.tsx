import type { Metadata } from 'next';

import Link from 'next/link';

import PageHeader from '@/components/custom/page-header';
import { buttonVariants } from '@/components/ui/button';
import { BudgetDetail } from '@/features/it/components/budgets/budget-detail';
import {
  getBudgetActualsByMonth,
  getBudgetById,
} from '@/features/it/services/budgets/data';
import { getFinancialYearLabel } from '@/lib/helpers/dates';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Budget Details',
};

type Params = Promise<{ budgetId: string }>;

export default async function BudgetDetailPage({
  params,
}: {
  params: Params;
}) {
  const { budgetId } = await params;

  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const budget = await getBudgetById(budgetId);
  const actuals = await getBudgetActualsByMonth(
    budget.financialYearStart,
    budget.subCategoryId,
  );

  const budgetedByMonth = new Map(
    budget.lines.map(line => [line.monthDate, Number(line.amount)]),
  );

  const months = actuals.map(({ monthDate, label, actual }) => ({
    monthDate,
    label,
    budgeted: budgetedByMonth.get(monthDate) ?? 0,
    actual,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={budget.subCategory.name.toUpperCase()}
        description={`${budget.subCategory.itCategory.name.toUpperCase()} • FY ${getFinancialYearLabel(budget.financialYearStart)}`}
        content={
          <div className="flex gap-2">
            <Link
              href="/it/expenses-budgeting/budgets"
              className={buttonVariants({ variant: 'outline' })}
            >
              Back to Budgets
            </Link>
            <Link
              href={`/it/expenses-budgeting/budgets/${budget.id}/edit`}
              className={buttonVariants({ variant: 'default' })}
            >
              Edit Budget
            </Link>
          </div>
        }
      />
      <BudgetDetail months={months} />
    </div>
  );
}
