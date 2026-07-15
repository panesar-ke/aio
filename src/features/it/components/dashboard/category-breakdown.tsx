import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty';
import { type CategoryRollupRow } from '@/features/it/services/dashboard/data';
import { getCategoryColor } from '@/features/it/utils/dashboard/colors';
import { numberFormat } from '@/lib/helpers/formatters';

export function CategoryBreakdown({
  categories,
  periodLabel,
}: {
  categories: Array<CategoryRollupRow>;
  periodLabel: string;
}) {
  const totalActual = categories.reduce((sum, row) => sum + row.actual, 0);
  const sorted = [...categories].sort((a, b) => b.actual - a.actual);

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>By Category</CardTitle>
        <p className="text-sm text-muted-foreground">{periodLabel}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalActual === 0 ? (
          <EmptyState
            title="No expenses in this period"
            description="Category spending will appear here once expenses are recorded."
            variant="default"
          />
        ) : (
          <>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {sorted.map(row => {
                const percentage =
                  totalActual > 0 ? (row.actual / totalActual) * 100 : 0;
                if (percentage === 0) return null;
                return (
                  <div
                    key={row.categoryId}
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getCategoryColor(row.colorIndex),
                    }}
                  />
                );
              })}
            </div>
            <ul className="space-y-3">
              {sorted.map(row => {
                const percentage =
                  totalActual > 0
                    ? Math.round((row.actual / totalActual) * 100)
                    : 0;
                return (
                  <li
                    key={row.categoryId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor: getCategoryColor(row.colorIndex),
                        }}
                      />
                      {row.categoryName}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {percentage}%
                      </span>
                      <span className="font-medium">
                        {numberFormat(row.actual)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
