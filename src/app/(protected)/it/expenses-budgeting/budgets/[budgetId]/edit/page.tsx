import type { Metadata } from 'next';

import { BudgetForm } from '@/features/it/components/budgets/budget-form';
import { getBudgetById } from '@/features/it/services/budgets/data';
import {
  getCategories,
  getSubCategories,
} from '@/features/it/services/expenses/data';
import {
  getFinancialYearLabel,
  getFinancialYearOptions,
} from '@/lib/helpers/dates';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Edit Budget',
};

type Params = Promise<{ budgetId: string }>;

export default async function EditBudgetPage({ params }: { params: Params }) {
  const { budgetId } = await params;

  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const [categories, subCategories, budget] = await Promise.all([
    getCategories(),
    getSubCategories(),
    getBudgetById(budgetId),
  ]);

  const financialYearOptions = getFinancialYearOptions();
  const hasCurrentFinancialYear = financialYearOptions.some(
    option => option.value === budget.financialYearStart.toString(),
  );

  if (!hasCurrentFinancialYear) {
    financialYearOptions.push({
      value: budget.financialYearStart.toString(),
      label: getFinancialYearLabel(budget.financialYearStart),
    });
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <BudgetForm
        categories={categories}
        subCategories={subCategories}
        financialYearOptions={financialYearOptions}
        initialValues={{
          id: budget.id,
          financialYearStart: budget.financialYearStart.toString(),
          categoryId: budget.subCategory.categoryId,
          subCategoryId: budget.subCategoryId,
          monthAmounts: budget.lines.map(line => Number(line.amount)),
        }}
      />
    </div>
  );
}
