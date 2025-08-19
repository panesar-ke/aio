import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  FileText,
  Calendar,
  AwardIcon,
} from 'lucide-react';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import type { SearchParams } from '@/types/index.types';
import {
  getVendors,
  getVendorStats,
} from '@/features/procurement/services/vendors/data';
import { ErrorNotification } from '@/components/custom/error-components';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { compactNumberFormatter } from '@/lib/helpers/formatters';
import { TableSkeleton } from '@/components/custom/table-skeleton';
import { VendorsDatatable } from '@/features/procurement/components/vendors/vendors-datatable';

export const metadata: Metadata = {
  title: 'Vendors',
};

export default async function VendorsPage({ searchParams }: SearchParams) {
  const { search } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        path="/procurement/vendors/new"
        description="Manage your vendors here. You can add, edit, or delete vendor information."
      />
      <ErrorBoundary
        fallback={<ErrorNotification message="Error loading vendor data" />}
      >
        <Suspense fallback={<VendorStatsLoading />}>
          <VendorStats />
        </Suspense>
      </ErrorBoundary>

      <Search placeholder="Search vendor...." />

      <ErrorBoundary
        fallback={<ErrorNotification message="Error loading vendors" />}
      >
        <Suspense
          fallback={
            <TableSkeleton
              rowCount={10}
              columnWidths={['w-56', 'w-32', 'w-32', 'w-32', 'w-32', 'w-1']}
            />
          }
        >
          <SuspensedVendors search={search} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

async function SuspensedVendors({ search }: { search?: string }) {
  const vendors = await getVendors(search);
  return <VendorsDatatable vendors={vendors} />;
}

async function VendorStats() {
  const vendorStats = await getVendorStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <VendorStat
        title="Total Vendors"
        value={vendorStats.totalVendors}
        description="Active vendor accounts"
        icon={<Users className="h-4 w-4" />}
      />

      <VendorStat
        title="Active (12 Months)"
        value={vendorStats.activeVendors}
        description="Vendors with orders in the past year"
        icon={<FileText className="h-4 w-4" />}
      />

      <VendorStat
        title="Purchases (30 Days)"
        value={compactNumberFormatter(vendorStats.revenue.currentPeriod)}
        description="Total purchase orders"
        trend={{
          value: vendorStats.revenue.percentageChange,
          type: vendorStats.revenue.trend as 'up' | 'down' | 'stable',
        }}
        icon={<Calendar className="h-4 w-4" />}
      />

      <VendorStat
        title="Top Vendor"
        value={`Ksh${compactNumberFormatter(
          vendorStats.topVendor?.totalSpent || 0
        )}`}
        description={vendorStats.topVendor?.vendorName || 'N/A'}
        icon={<AwardIcon className="h-4 w-4" />}
      />
    </div>
  );
}

interface VendorStatProps {
  title: string;
  value: string | number;
  description: string;
  trend?: {
    value: number;
    type: 'up' | 'down' | 'stable';
  };
  icon?: React.ReactNode;
}

function VendorStat({
  title,
  value,
  description,
  trend,
  icon,
}: VendorStatProps) {
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.type) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';

    switch (trend.type) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      case 'stable':
        return 'text-gray-500';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium tracking-tight">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      <div className="flex items-baseline space-x-2">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={cn('flex items-center space-x-1', getTrendColor())}>
            {getTrendIcon()}
            <span className="text-xs font-medium">
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground truncate">{description}</p>
    </div>
  );
}

export function VendorStatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map(() => (
        <div
          key={crypto.randomUUID()}
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
        >
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-baseline space-x-2 pb-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>

          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
