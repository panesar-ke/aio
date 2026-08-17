import type { LucideIcon } from 'lucide-react';
import type { Route } from 'next';

import {
  ActivityIcon,
  BarChart3Icon,
  BuildingIcon,
  ChartPieIcon,
  ConstructionIcon,
  ReceiptTextIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadStatus } from '@/features/sales/utils/search-params';

const PLANNED_STATS: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: 'Revenue',
    description: 'Total value of sale orders in the period',
    icon: TrendingUpIcon,
  },
  {
    title: 'Orders',
    description: 'Number of sale orders placed',
    icon: ReceiptTextIcon,
  },
  {
    title: 'New Leads',
    description: 'Leads captured and awaiting qualification',
    icon: TargetIcon,
  },
  {
    title: 'Active Accounts',
    description: 'Accounts that ordered in the period',
    icon: BuildingIcon,
  },
];

const PLANNED_PANELS: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: 'Sales Over Time',
    description: 'Daily order value trended against the previous period.',
    icon: BarChart3Icon,
  },
  {
    title: 'Revenue by Account Tier',
    description: 'Contribution split across high, mid and low tier accounts.',
    icon: ChartPieIcon,
  },
];

const CHART_BAR_HEIGHTS = [45, 70, 35, 85, 55, 95, 65];

const PIPELINE_STAGES = Object.values(LeadStatus).filter(
  status => status !== LeadStatus.all,
);

const QUICK_LINKS: Array<{
  label: string;
  description: string;
  path: Route;
  icon: LucideIcon;
}> = [
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
];

export function WipBanner() {
  return (
    <div className='flex items-start gap-3 rounded-lg border border-dashed bg-muted/40 p-4'>
      <ConstructionIcon className='mt-0.5 size-5 shrink-0 text-muted-foreground' />
      <div className='space-y-1'>
        <p className='text-sm font-medium'>
          This dashboard is still being built
        </p>
        <p className='text-sm text-muted-foreground'>
          The layout below is a placeholder. No figures are being read from the
          database yet, so nothing shown here should be used for reporting.
        </p>
      </div>
    </div>
  );
}

function PlaceholderStatCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className='rounded-lg border bg-card p-6 text-card-foreground shadow-sm'>
      <div className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <h3 className='text-sm font-medium tracking-tight'>{title}</h3>
        <Icon className='size-4 text-muted-foreground' />
      </div>
      <Skeleton className='h-8 w-24' aria-hidden />
      <p className='mt-2 text-xs text-muted-foreground truncate'>
        {description}
      </p>
    </div>
  );
}

function PlaceholderPanel({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Icon className='size-4 text-muted-foreground' />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex h-56 items-end gap-2 rounded-md border border-dashed p-4'>
          {CHART_BAR_HEIGHTS.map(height => (
            <Skeleton
              key={height}
              className='flex-1'
              style={{ height: `${height}%` }}
              aria-hidden
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesDashboardWip() {
  return (
    <div className='space-y-6'>
      <WipBanner />

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {PLANNED_STATS.map(stat => (
          <PlaceholderStatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <PlaceholderPanel {...PLANNED_PANELS[0]} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Lead Pipeline</CardTitle>
            <CardDescription>
              Lead counts per stage, sourced from the leads module.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {PIPELINE_STAGES.map(stage => (
              <div key={stage} className='flex items-center gap-3'>
                <span className='w-24 shrink-0 text-sm capitalize text-muted-foreground'>
                  {stage}
                </span>
                <Skeleton className='h-2.5 flex-1' aria-hidden />
                <Skeleton className='h-4 w-8 shrink-0' aria-hidden />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <PlaceholderPanel {...PLANNED_PANELS[1]} />
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Recent Activity</CardTitle>
            <CardDescription>
              Latest lead conversions and sale orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Empty className='border'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <ActivityIcon />
                </EmptyMedia>
                <EmptyTitle>Nothing wired up yet</EmptyTitle>
                <EmptyDescription>
                  This feed will show conversions and orders once the dashboard
                  queries are in place.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}

export function WipBadge() {
  return (
    <Badge variant='warning' className='gap-1.5'>
      <ConstructionIcon />
      Work in progress
    </Badge>
  );
}
