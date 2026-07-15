import type { Metadata } from "next";

import { ExpenseForm } from "@/features/it/components/expenses/expense-form";
import {
  getCategories,
  getExpenseById,
  getSubCategories,
} from "@/features/it/services/expenses/data";
import { getVendors } from "@/features/procurement/services/vendors/data";
import { requireAnyPermission } from "@/lib/permissions/guards";
import { getAssignableAssets } from "@/features/it/assets/services/data";

export const metadata: Metadata = {
  title: "Edit Expense",
};

type Params = Promise<{ expenseId: string }>;

export default async function ExpenseEditPage({ params }: { params: Params }) {
  const { expenseId } = await params;

  await requireAnyPermission(["it:admin", "it:standard"], { mode: "page" });

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
        description: expense.description || "",
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
