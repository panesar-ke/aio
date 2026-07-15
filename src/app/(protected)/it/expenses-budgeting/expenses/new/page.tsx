import type { Metadata } from "next";

import { ExpenseForm } from "@/features/it/components/expenses/expense-form";
import {
  getCategories,
  getSubCategories,
} from "@/features/it/services/expenses/data";
import { getVendors } from "@/features/procurement/services/vendors/data";
import { requireAnyPermission } from "@/lib/permissions/guards";
import { getAssignableAssets } from "@/features/it/assets/services/data";

export const metadata: Metadata = {
  title: "New Expense",
};

export default async function NewExpensePage() {
  await requireAnyPermission(["it:admin", "it:standard"], { mode: "page" });
  const [categories, subCategories, vendors, assets] = await Promise.all([
    getCategories(),
    getSubCategories(),
    getVendors(),
    getAssignableAssets(),
  ]);

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <ExpenseForm
        categories={categories}
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
    </div>
  );
}
