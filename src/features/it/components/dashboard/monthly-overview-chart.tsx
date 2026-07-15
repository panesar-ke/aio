'use client';

import { Bar, BarChart, CartesianGrid, Legend, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { type MonthlyOverviewPoint } from '@/features/it/services/dashboard/data';
import { numberFormat } from '@/lib/helpers/formatters';

const chartConfig = {
  spent: {
    label: 'Spent',
    color: 'var(--chart-1)',
  },
  budget: {
    label: 'Budget',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function MonthlyOverviewChart({
  data,
}: {
  data: Array<MonthlyOverviewPoint>;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Monthly Overview</CardTitle>
        <CardDescription>Spending vs budget for the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <BarChart data={data} accessibilityLayer>
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
            <Bar dataKey="spent" radius={4} fill="var(--color-spent)" />
            <Bar dataKey="budget" radius={4} fill="var(--color-budget)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
