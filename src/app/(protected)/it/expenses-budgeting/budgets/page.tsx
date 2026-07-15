import type { Metadata } from 'next';

import PageHeader from '@/components/custom/page-header';
import { BudgetsPage } from '@/features/it/components/budgets/budgets-page';
import { getFinancialYearOptions } from '@/lib/helpers/dates';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'IT Budgets',
};

export default async function ITBudgetsPage() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="IT Budgets"
        description="Plan and manage IT department budgets by financial year"
        path="/it/expenses-budgeting/budgets/new"
        buttonText="New Budget"
      />
      <BudgetsPage financialYearOptions={getFinancialYearOptions()} />
    </div>
  );
}
