'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import type { ITAssetsDashboardStats } from '@/features/it/assets/services/dashboard';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { numberFormat } from '@/lib/helpers/formatters';

const chartConfig = {
  totalCost: {
    label: 'Cost',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export function CostDistributionCharts({
  breakdowns,
}: {
  breakdowns: ITAssetsDashboardStats['breakdowns'];
}) {
  const categoryData = breakdowns.costByCategory.slice(0, 8).map(item => ({
    label: item.label,
    totalCost: item.totalCost,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={categoryData}>
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
                  formatter={value => `Ksh ${numberFormat(value as number)}`}
                />
              }
            />
            <Bar dataKey="totalCost" radius={6} fill="var(--color-totalCost)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
