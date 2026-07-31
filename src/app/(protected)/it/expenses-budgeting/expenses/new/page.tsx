import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import { getAssignableAssets } from '@/features/it/assets/services/data';
import { ExpenseForm } from '@/features/it/components/expenses/expense-form';
import {
  getCategories,
  getSubCategories,
} from '@/features/it/services/expenses/data';
import { getVendors } from '@/features/procurement/services/vendors/data';
import { dateFormat } from '@/lib/helpers/formatters';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'New Expense',
};

export default function NewExpensePage() {
  return (
    <div className="container max-w-2xl mx-auto p-4">
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the expense form"
        loader={<FormLoader />}
      >
        <NewExpenseContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function NewExpenseContent() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const [categories, subCategories, vendors, assets] = await Promise.all([
    getCategories(),
    getSubCategories(),
    getVendors(),
    getAssignableAssets(),
  ]);

  return (
    <ExpenseForm
      categories={categories}
      subCategories={subCategories}
      assets={assets.map(({ label, value }) => ({
        id: value,
        name: label.toUpperCase(),
      }))}
      defaultExpenseDate={dateFormat(new Date())}
      vendors={vendors.map(({ id, vendorName }) => ({
        value: id,
        label: vendorName.toUpperCase(),
      }))}
    />
  );
}
