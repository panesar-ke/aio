import type { Metadata } from 'next';

import { HandCoinsIcon, WalletIcon } from 'lucide-react';
import Link from 'next/link';

import PageHeader from '@/components/custom/page-header';
import { buttonVariants } from '@/components/ui/button';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'IT Expenses & Budgeting',
};

export default async function ITExpensesBudgetingPage() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  return (
    <PageHeader
      title="IT Expenses & Budgeting"
      description="Manage IT department expenses and budgets"
      content={
        <div className="flex gap-4 items-center">
          <Link
            href="/it/expenses-budgeting/budgets"
            className={buttonVariants({ variant: 'tertiary' })}
          >
            <WalletIcon />
            Manage Budgets
          </Link>
          <Link
            href="/it/expenses-budgeting/expenses"
            className={buttonVariants({ variant: 'pdfExport' })}
          >
            <HandCoinsIcon />
            Manage Expenses
          </Link>
        </div>
      }
    />
  );
}
