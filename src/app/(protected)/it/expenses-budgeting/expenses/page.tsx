import PageHeader from '@/components/custom/page-header';
import type { Metadata } from 'next';

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
    </div>
  );
}
