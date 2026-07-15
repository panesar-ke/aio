'use client';

import { Bar, BarChart, CartesianGrid, Legend, XAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { numberFormat } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

const chartConfig = {
  budgeted: {
    label: 'Budgeted',
    color: 'var(--chart-1)',
  },
  actual: {
    label: 'Actual',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export type BudgetDetailMonth = {
  monthDate: string;
  label: string;
  budgeted: number;
  actual: number;
};

export function BudgetDetail({
  months,
}: {
  months: Array<BudgetDetailMonth>;
}) {
  const totalBudgeted = months.reduce((sum, month) => sum + month.budgeted, 0);
  const totalActual = months.reduce((sum, month) => sum + month.actual, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <BarChart data={months}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={value => numberFormat(value as number)}
                  />
                }
              />
              <Legend />
              <Bar
                dataKey="budgeted"
                radius={4}
                fill="var(--color-budgeted)"
              />
              <Bar dataKey="actual" radius={4} fill="var(--color-actual)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Budgeted</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map(month => {
                const variance = month.budgeted - month.actual;
                return (
                  <TableRow key={month.monthDate}>
                    <TableCell>{month.label}</TableCell>
                    <TableCell>{numberFormat(month.budgeted)}</TableCell>
                    <TableCell>{numberFormat(month.actual)}</TableCell>
                    <TableCell
                      className={cn(
                        'font-medium',
                        variance < 0 ? 'text-destructive' : 'text-emerald-600',
                      )}
                    >
                      {numberFormat(variance)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell>Total</TableCell>
                <TableCell>{numberFormat(totalBudgeted)}</TableCell>
                <TableCell>{numberFormat(totalActual)}</TableCell>
                <TableCell
                  className={cn(
                    totalBudgeted - totalActual < 0
                      ? 'text-destructive'
                      : 'text-emerald-600',
                  )}
                >
                  {numberFormat(totalBudgeted - totalActual)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
