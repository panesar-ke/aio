'use client';

import type React from 'react';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, XAxis } from 'recharts';
import {
  BarChart3Icon,
  BuildingIcon,
  ReceiptTextIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import Link from 'next/link';

import type { ChartConfig } from '@/components/ui/chart';
import type { SalesDashboard } from '@/features/sales/utils/sales.types';
import type { Option } from '@/types/index.types';

import { MiniSelect } from '@/components/custom/mini-select';
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { useSalesDashboardFilters } from '@/features/sales/hooks/leads/use-filters';
import {
  formatCompactCurrency,
  formatCurrency,
} from '@/features/sales/utils/account-helpers';
import { dateFormat } from '@/lib/helpers/formatters';

const salesOverTimeChartConfig = {
  current: {
    label: 'Selected Year',
    color: 'var(--chart-1)',
  },
  previous: {
    label: 'Previous Year',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const revenueByTierChartConfig = {
  revenue: {
    label: 'Revenue',
  },
  high: {
    label: 'High',
    color: 'var(--chart-1)',
  },
  medium: {
    label: 'Medium',
    color: 'var(--chart-2)',
  },
  low: {
    label: 'Low',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

const QUICK_LINKS = [
  {
    label: 'Leads',
    description: 'Track and qualify prospects',
    path: '/sales/leads',
    icon: TargetIcon,
  },
  {
    label: 'Accounts',
    description: 'Customers from converted leads',
    path: '/sales/accounts',
    icon: UsersIcon,
  },
  {
    label: 'Sale Orders',
    description: 'Raise and review sale orders',
    path: '/sales/orders',
    icon: ReceiptTextIcon,
  },
] as const;

type PageProps = {
  dashboard: SalesDashboard;
  financialYears: Array<Option>;
  salesPersons: Array<Option>;
  isSalesAdmin: boolean;
};

function formatDelta(deltaPct: number | null) {
  if (deltaPct === null) {
    return 'No prior period';
  }

  const rounded = Math.round(deltaPct);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}% vs previous year`;
}

function KpiCard({
  title,
  description,
  value,
  deltaPct,
  icon,
}: {
  title: string;
  description: string;
  value: string;
  deltaPct: number | null;
  icon: React.ReactNode;
}) {
  return (
    <Card className='shadow-none'>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <p className='text-sm font-medium tracking-tight'>{title}</p>
        <div className='text-muted-foreground'>{icon}</div>
      </CardHeader>
      <CardContent className='space-y-1'>
        <p className='text-2xl font-semibold'>{value}</p>
        <p className='text-xs text-muted-foreground'>{description}</p>
        <p className='text-xs text-muted-foreground'>{formatDelta(deltaPct)}</p>
      </CardContent>
    </Card>
  );
}

function DashboardFilters({
  financialYears,
  salesPersons,
  isSalesAdmin,
}: {
  financialYears: Array<Option>;
  salesPersons: Array<Option>;
  isSalesAdmin: boolean;
}) {
  const { filters, onFinancialYearChange, onSalesPersonChange } =
    useSalesDashboardFilters();

  return (
    <div className='grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3'>
      <MiniSelect
        withForm={false}
        placeholder='Financial Year'
        options={financialYears}
        className='bg-background'
        value={filters.financialYear}
        onChange={onFinancialYearChange}
      />
      {isSalesAdmin && (
        <MiniSelect
          withForm={false}
          placeholder='All Sales Persons'
          options={[{ value: '', label: 'All' }, ...salesPersons]}
          className='bg-background'
          value={filters.salesPerson}
          onChange={onSalesPersonChange}
        />
      )}
    </div>
  );
}

function SalesOverTimeCard({
  monthlySales,
  financialYearLabel,
}: {
  monthlySales: SalesDashboard['monthlySales'];
  financialYearLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <BarChart3Icon className='size-4 text-muted-foreground' />
          Sales Over Time
        </CardTitle>
        <CardDescription>
          Order value trended across {financialYearLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={salesOverTimeChartConfig}
          className='aspect-auto h-56 w-full'
        >
          <AreaChart data={monthlySales}>
            <defs>
              <linearGradient id='fillCurrentSales' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-current)' stopOpacity={0.3} />
                <stop offset='95%' stopColor='var(--color-current)' stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className='flex w-full items-center justify-between gap-4'>
                      <span className='text-muted-foreground'>
                        {name === 'current' ? 'Selected Year' : 'Previous Year'}
                      </span>
                      <span className='font-medium'>
                        {formatCompactCurrency(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey='previous'
              type='monotone'
              stroke='var(--color-previous)'
              fill='transparent'
              strokeWidth={2}
            />
            <Area
              dataKey='current'
              type='monotone'
              stroke='var(--color-current)'
              fill='url(#fillCurrentSales)'
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function TopCategoriesCard({
  categories,
}: {
  categories: SalesDashboard['topCategories'];
}) {
  const maxRevenue = categories[0]?.revenue ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Top 5 Categories</CardTitle>
        <CardDescription>
          Best-performing sales categories by order value.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {categories.length === 0 ? (
          <Empty className='border'>
            <EmptyHeader>
              <EmptyTitle>No category sales yet</EmptyTitle>
              <EmptyDescription>
                Categories will appear here once orders are raised in the selected year.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          categories.map(category => (
            <div key={category.category} className='space-y-2'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-sm text-muted-foreground'>{category.category}</span>
                <span className='text-sm font-medium'>
                  {formatCompactCurrency(category.revenue)}
                </span>
              </div>
              <Progress
                value={maxRevenue > 0 ? (category.revenue / maxRevenue) * 100 : 0}
                className='h-2.5'
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RevenueByAccountTierCard({
  revenueByAccountTier,
  financialYearLabel,
}: {
  revenueByAccountTier: SalesDashboard['revenueByAccountTier'];
  financialYearLabel: string;
}) {
  const chartData = revenueByAccountTier.map((tier, index) => ({
    tier: tier.tier,
    label: tier.label,
    revenue: tier.revenue,
    fill: `var(--chart-${index + 1})`,
  }));

  return (
    <Card className='flex flex-col'>
      <CardHeader>
        <CardTitle className='text-base'>Revenue by Account Tier</CardTitle>
        <CardDescription>
          Contribution split across account tiers in {financialYearLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-1'>
        {chartData.every(item => item.revenue === 0) ? (
          <Empty className='border'>
            <EmptyHeader>
              <EmptyTitle>No tier revenue yet</EmptyTitle>
              <EmptyDescription>
                This chart will populate once the selected year has sales.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer
            config={revenueByTierChartConfig}
            className='mx-auto aspect-square max-h-[280px]'
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey='tier'
                    formatter={value => formatCompactCurrency(Number(value))}
                    hideLabel
                  />
                }
              />
              <Pie data={chartData} dataKey='revenue' nameKey='tier' />
              <ChartLegend
                content={
                  <ChartLegendContent
                    nameKey='tier'
                    className='flex-wrap gap-2 *:justify-center'
                  />
                }
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({
  recentActivity,
}: {
  recentActivity: SalesDashboard['recentActivity'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Recent Activity</CardTitle>
        <CardDescription>Latest sale orders and newly captured leads.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <Empty className='border'>
            <EmptyHeader>
              <EmptyTitle>No recent activity</EmptyTitle>
              <EmptyDescription>
                Activity will appear here once new leads or sale orders are added.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className='space-y-4'>
            {recentActivity.map(item => (
              <div
                key={item.id}
                className='flex items-start justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0'
              >
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>{item.title}</p>
                  <p className='text-xs text-muted-foreground'>{item.description}</p>
                </div>
                <p className='shrink-0 text-xs text-muted-foreground'>
                  {dateFormat(item.date, 'long')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JumpBackIn() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Jump Back In</CardTitle>
        <CardDescription>
          The parts of the sales module that are already live.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        {QUICK_LINKS.map(({ label, description, path, icon: Icon }) => (
          <Link
            key={label}
            href={path}
            prefetch={false}
            className='flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground'
          >
            <Icon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
            <div className='space-y-0.5'>
              <p className='text-sm font-medium'>{label}</p>
              <p className='text-xs text-muted-foreground'>{description}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function ClientSalesDashboardPage({
  dashboard,
  financialYears,
  salesPersons,
  isSalesAdmin,
}: PageProps) {
  return (
    <div className='space-y-6'>
      <DashboardFilters
        financialYears={financialYears}
        salesPersons={salesPersons}
        isSalesAdmin={isSalesAdmin}
      />

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <KpiCard
          title='Revenue'
          description='Total value of sale orders in the period'
          value={formatCompactCurrency(dashboard.kpis.revenue.value)}
          deltaPct={dashboard.kpis.revenue.deltaPct}
          icon={<TrendingUpIcon className='size-4' />}
        />
        <KpiCard
          title='Orders'
          description='Number of sale orders placed'
          value={dashboard.kpis.orders.value.toLocaleString('en-KE')}
          deltaPct={dashboard.kpis.orders.deltaPct}
          icon={<ReceiptTextIcon className='size-4' />}
        />
        <KpiCard
          title='New Leads'
          description='Leads captured and awaiting qualification'
          value={dashboard.kpis.newLeads.value.toLocaleString('en-KE')}
          deltaPct={dashboard.kpis.newLeads.deltaPct}
          icon={<TargetIcon className='size-4' />}
        />
        <KpiCard
          title='Active Accounts'
          description='Accounts that ordered in the period'
          value={dashboard.kpis.activeAccounts.value.toLocaleString('en-KE')}
          deltaPct={dashboard.kpis.activeAccounts.deltaPct}
          icon={<BuildingIcon className='size-4' />}
        />
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <SalesOverTimeCard
            monthlySales={dashboard.monthlySales}
            financialYearLabel={dashboard.filters.financialYearLabel}
          />
        </div>
        <TopCategoriesCard categories={dashboard.topCategories} />
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <RevenueByAccountTierCard
          revenueByAccountTier={dashboard.revenueByAccountTier}
          financialYearLabel={dashboard.filters.financialYearLabel}
        />
        <RecentActivityCard recentActivity={dashboard.recentActivity} />
      </div>

      <JumpBackIn />
    </div>
  );
}
