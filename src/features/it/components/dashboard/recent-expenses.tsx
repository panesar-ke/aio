import { format } from 'date-fns';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty';
import { type RecentExpense } from '@/features/it/services/dashboard/data';
import { numberFormat } from '@/lib/helpers/formatters';

export function RecentExpenses({
  expenses,
}: {
  expenses: Array<RecentExpense>;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Link
          href="/it/expenses-budgeting/expenses"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <EmptyState
            title="No transactions in this period"
            description="Recorded expenses will show up here."
            variant="default"
          />
        ) : (
          <ul className="divide-y">
            {expenses.map(expense => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{expense.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {expense.subCategory} · {expense.category}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium">-{numberFormat(expense.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(expense.expenseDate), 'MMM d')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
