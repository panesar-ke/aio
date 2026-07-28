import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { AuthedPageLoader } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import { BudgetsPage } from '@/features/it/components/budgets/budgets-page';
import { getFinancialYearOptions } from '@/lib/helpers/dates';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'IT Budgets',
};

export default function ITBudgetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="IT Budgets"
        description="Plan and manage IT department budgets by financial year"
        path="/it/expenses-budgeting/budgets/new"
        buttonText="New Budget"
      />
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load budgets"
        loader={<AuthedPageLoader />}
      >
        <BudgetsContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function BudgetsContent() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const financialYearOptions = getFinancialYearOptions();

  return (
    <BudgetsPage
      financialYearOptions={financialYearOptions}
      defaultFinancialYearStart={financialYearOptions[0]?.value ?? ''}
    />
  );
}
