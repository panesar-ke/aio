import {
  CalendarIcon,
  CreditCardIcon,
  TriangleAlertIcon,
  WalletIcon,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { type DashboardKpis } from '@/features/it/services/dashboard/data';
import { numberFormat } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

function formatDelta(deltaPct: number | null) {
  if (deltaPct === null) return null;
  const rounded = Math.round(deltaPct);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}

function DeltaLine({
  deltaPct,
  context,
}: {
  deltaPct: number | null;
  context: string;
}) {
  if (deltaPct === null) {
    return <p className="text-xs text-muted-foreground">{context}</p>;
  }

  const isIncrease = deltaPct > 0;

  return (
    <p className="text-xs text-muted-foreground">
      <span
        className={cn(
          'font-medium',
          isIncrease ? 'text-destructive' : 'text-emerald-600',
        )}
      >
        {formatDelta(deltaPct)}
      </span>{' '}
      {context}
    </p>
  );
}

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const worstOverBudget = kpis.overBudgetCategories[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <CreditCardIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-semibold">
            {numberFormat(kpis.totalSpent)}
          </p>
          <DeltaLine
            deltaPct={kpis.totalSpentDeltaPct}
            context="vs previous period"
          />
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-sm text-muted-foreground">Remaining Budget</p>
          <WalletIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-1">
          <p
            className={cn(
              'text-2xl font-semibold',
              kpis.remainingBudget < 0 && 'text-destructive',
            )}
          >
            {numberFormat(kpis.remainingBudget)}
          </p>
          <p className="text-xs text-muted-foreground">
            of {numberFormat(kpis.totalBudget)} total budgeted
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-sm text-muted-foreground">Over Budget</p>
          <TriangleAlertIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-semibold">
            {kpis.overBudgetCategories.length}{' '}
            {kpis.overBudgetCategories.length === 1 ? 'category' : 'categories'}
          </p>
          <p className="text-xs text-muted-foreground">
            {worstOverBudget ? (
              <>
                <span className="font-medium text-destructive">
                  +{numberFormat(worstOverBudget.overAmount)}
                </span>{' '}
                {worstOverBudget.categoryName} is over
              </>
            ) : (
              'All categories on track'
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-sm text-muted-foreground">Avg Monthly Spend</p>
          <CalendarIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-semibold">
            {numberFormat(kpis.avgMonthlySpend)}
          </p>
          <DeltaLine
            deltaPct={kpis.avgMonthlySpendDeltaPct}
            context="vs previous period"
          />
        </CardContent>
      </Card>
    </div>
  );
}
