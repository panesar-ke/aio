'use client';

import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import type { ITAssetsDashboardStats } from '@/features/it/assets/services/dashboard';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  assigned: {
    label: 'Assigned',
    color: 'var(--chart-1)',
  },
  returned: {
    label: 'Returned',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function AssignmentTrendChart({
  data,
}: {
  data: ITAssetsDashboardStats['trends']['assignmentActivity'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Activity (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={value => {
                const [y, m, d] = value.split('-').map(Number);
                return new Date(y, m - 1, d).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={value =>
                    new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
              }
            />
            <Line
              type="monotone"
              dataKey="assigned"
              stroke="var(--color-assigned)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="returned"
              stroke="var(--color-returned)"
              strokeWidth={2}
              dot={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
