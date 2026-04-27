'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { ITAssetsDashboardStats } from '@/features/it/assets/services/dashboard';
import { reportCaseFormatter } from '@/lib/helpers/formatters';

const chartConfig = {
  count: {
    label: 'Assets',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function AssetStatusConditionCharts({
  breakdowns,
}: {
  breakdowns: ITAssetsDashboardStats['breakdowns'];
}) {
  const statusData = breakdowns.status.map(item => ({
    label: reportCaseFormatter(item.label),
    count: item.count,
  }));

  const conditionData = breakdowns.condition.map(item => ({
    label: reportCaseFormatter(item.label),
    count: item.count,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Assets by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={statusData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" radius={6} fill="var(--color-count)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assets by Condition</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={conditionData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" radius={6} fill="var(--color-count)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
