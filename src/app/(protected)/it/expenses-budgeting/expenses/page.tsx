import PageHeader from '@/components/custom/page-header';
import { requireAnyPermission } from '@/lib/permissions/guards';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IT Expenses',
};

export default async function ITExpensesBudgetingExpensesPage() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="IT Expenses"
        description="Manage IT department expenses"
        path="/it/expenses-budgeting/expenses/new"
      />
    </div>
  );
}
