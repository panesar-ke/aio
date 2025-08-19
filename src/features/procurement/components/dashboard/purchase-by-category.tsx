'use client';

import { Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { getSpendingByProductCategory } from '@/features/procurement/services/dashboard/data';

export const description = 'A pie chart with a legend';

const chartConfig = {
  spending: {
    label: 'Spending',
  },
  'row material': {
    label: 'row material',
    color: 'var(--chart-1)',
  },
  'intermediate product': {
    label: 'intermediate product',
    color: 'var(--chart-2)',
  },
  'finished goods': {
    label: 'finished goods',
    color: 'var(--chart-3)',
  },

  other: {
    label: 'Other',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

export function PurchaseByCategory({
  spendingByProductCategory,
}: {
  spendingByProductCategory: Awaited<
    ReturnType<typeof getSpendingByProductCategory>
  >;
}) {
  const chartData = spendingByProductCategory.map((category, index) => ({
    category: category.productCategory,
    spending: parseFloat(category.totalAmount?.toString() || '0'),
    fill: `var(--chart-${index + 1})`,
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Spending by Product Category</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="category" hideLabel />}
            />
            <Pie data={chartData} dataKey="spending" />
            <ChartLegend
              content={<ChartLegendContent nameKey="category" />}
              className="-translate-y-2 flex-wrap gap-2  *:justify-center capitalize"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
