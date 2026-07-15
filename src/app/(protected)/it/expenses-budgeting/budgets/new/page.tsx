import type { Metadata } from 'next';

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

export default async function NewBudgetPage() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const [categories, subCategories] = await Promise.all([
    getCategories(),
    getSubCategories(),
  ]);

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <BudgetForm
        categories={categories}
        subCategories={subCategories}
        financialYearOptions={getFinancialYearOptions()}
      />
    </div>
  );
}
