import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty';
import { type CategoryRollupRow } from '@/features/it/services/dashboard/data';
import { getCategoryColor } from '@/features/it/utils/dashboard/colors';
import { numberFormat } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

/**
 * Category-level only, per the dashboard spec: no sub-category rows or
 * expandable trees, even though the Banani reference shows sub-category
 * breakdowns underneath each category.
 */
export function BudgetTracker({
  categories,
}: {
  categories: Array<CategoryRollupRow>;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Budget Tracker</CardTitle>
        <Link
          href="/it/expenses-budgeting/budgets"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Categories will appear here once they're created."
            variant="default"
          />
        ) : (
          <ul className="space-y-5">
            {categories.map(row => {
              const isOver = row.actual > row.budgeted;
              const progressPct =
                row.budgeted > 0
                  ? Math.min((row.actual / row.budgeted) * 100, 100)
                  : row.actual > 0
                    ? 100
                    : 0;
              const color = getCategoryColor(row.colorIndex);

              return (
                <li key={row.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      {row.categoryName}
                      {isOver && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          Over
                        </span>
                      )}
                    </span>
                    <span>
                      <span
                        className={cn(
                          'font-medium',
                          isOver && 'text-destructive',
                        )}
                      >
                        {numberFormat(row.actual)}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        / {numberFormat(row.budgeted)}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: isOver
                          ? 'var(--destructive)'
                          : color,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
