import type { Metadata } from 'next';

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

export default async function ExpenseEditPage({ params }: { params: Params }) {
  const { expenseId } = await params;

  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const [categories, subCategories, vendors, expense] = await Promise.all([
    getCategories(),
    getSubCategories(),
    getVendors(),
    getExpenseById(expenseId),
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
      vendors={vendors.map(({ id, vendorName }) => ({
        value: id,
        label: vendorName.toUpperCase(),
      }))}
    />
  );
}
