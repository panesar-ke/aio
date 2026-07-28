import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { AuthedPageLoader } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import { ExpensePage } from '@/features/it/components/expenses/expense-page';
import { dateFormat } from '@/lib/helpers/formatters';
import { getFinancialYearRanges } from '@/lib/helpers/dates';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'IT Expenses',
};

export default function ITExpensesBudgetingExpensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="IT Expenses"
        description="Manage IT department expenses"
        path="/it/expenses-budgeting/expenses/new"
      />
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load expenses"
        loader={<AuthedPageLoader />}
      >
        <ExpensesContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function ExpensesContent() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const financialYearRanges = getFinancialYearRanges();

  return (
    <ExpensePage
      defaultDateRange={{
        from: dateFormat(financialYearRanges.currentYear.from),
        to: dateFormat(financialYearRanges.currentYear.to),
      }}
    />
  );
}
