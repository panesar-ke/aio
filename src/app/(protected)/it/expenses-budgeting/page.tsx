import PageHeader from '@/components/custom/page-header';
import { buttonVariants } from '@/components/ui/button';
import { HandCoinsIcon, PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'IT Expenses & Budgeting',
};

export default function ITExpensesBudgetingPage() {
  return (
    <PageHeader
      title="IT Expenses & Budgeting"
      description="Manage IT department expenses and budgets"
      content={
        <div className="flex gap-4 items-center">
          {/* TODO: Update this CTA to the dedicated budget creation flow once that page is implemented. */}
          <Link
            href="/it/expenses-budgeting"
            className={buttonVariants({ variant: 'tertiary' })}
          >
            <PlusIcon />
            Create Budget
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
