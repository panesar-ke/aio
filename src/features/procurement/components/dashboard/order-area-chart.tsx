'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import type { getPurchasesByDate } from '@/features/procurement/services/dashboard/data';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  purchases: {
    label: 'Purchases',
  },
  item: {
    label: 'Item',
    color: 'var(--chart-1)',
  },
  service: {
    label: 'Service',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function OrderAreaChart({
  data,
}: {
  data: Awaited<ReturnType<typeof getPurchasesByDate>>;
}) {
  // const [timeRange, setTimeRange] = React.useState('90d');

  // const filteredData = chartData.filter(item => {
  //   const date = new Date(item.date);
  //   const referenceDate = new Date('2024-06-30');
  //   let daysToSubtract = 90;
  //   if (timeRange === '30d') {
  //     daysToSubtract = 30;
  //   } else if (timeRange === '7d') {
  //     daysToSubtract = 7;
  //   }
  //   const startDate = new Date(referenceDate);
  //   startDate.setDate(startDate.getDate() - daysToSubtract);
  //   return date >= startDate;
  // });

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Purchases by day</CardTitle>
          <CardDescription>
            Showing total purchases for the last 30 days
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillItem" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-item)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-item)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillService" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-service)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-service)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={value => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={value => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="service"
              type="natural"
              fill="url(#fillService)"
              stroke="var(--color-service)"
              stackId="a"
            />
            <Area
              dataKey="item"
              type="natural"
              fill="url(#fillItem)"
              stroke="var(--color-item)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function OrderAreaChartLoading() {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Purchases by day</CardTitle>
          <CardDescription>
            Showing total purchases for the last 30 days
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 h-[250px]">
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  );
}
