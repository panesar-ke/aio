import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import { BudgetForm } from '@/features/it/components/budgets/budget-form';
import {
  getCategories,
  getSubCategories,
} from '@/features/it/services/expenses/data';
import { getFinancialYearOptions } from '@/lib/helpers/dates';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'New Budget',
};

export default function NewBudgetPage() {
  return (
    <div className="container max-w-4xl mx-auto p-4">
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the budget form"
        loader={<FormLoader />}
      >
        <NewBudgetContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function NewBudgetContent() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const [categories, subCategories] = await Promise.all([
    getCategories(),
    getSubCategories(),
  ]);

  return (
    <BudgetForm
      categories={categories}
      subCategories={subCategories}
      financialYearOptions={getFinancialYearOptions()}
    />
  );
}
