import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import { getAssignableAssets } from '@/features/it/assets/services/data';
import { ExpenseForm } from '@/features/it/components/expenses/expense-form';
import {
  getCategories,
  getExpenseById,
  getSubCategories,
} from '@/features/it/services/expenses/data';
import { getVendors } from '@/features/procurement/services/vendors/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Edit Expense',
};

type Params = Promise<{ expenseId: string }>;

export default function ExpenseEditPage({ params }: { params: Params }) {
  return (
    <div className="container max-w-2xl mx-auto p-4">
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the expense form"
        loader={<FormLoader />}
      >
        <EditExpenseContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function EditExpenseContent({ params }: { params: Params }) {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const { expenseId } = await params;

  const [categories, subCategories, vendors, expense, assets] =
    await Promise.all([
      getCategories(),
      getSubCategories(),
      getVendors(),
      getExpenseById(expenseId),
      getAssignableAssets(),
    ]);

  return (
    <ExpenseForm
      categories={categories}
      initialValues={{
        ...expense,
        amount: Number(expense.amount),
        description: expense.description || '',
      }}
      subCategories={subCategories}
      assets={assets.map(({ label, value }) => ({
        id: value,
        name: label.toUpperCase(),
      }))}
      vendors={vendors.map(({ id, vendorName }) => ({
        value: id,
        label: vendorName.toUpperCase(),
      }))}
    />
  );
}
