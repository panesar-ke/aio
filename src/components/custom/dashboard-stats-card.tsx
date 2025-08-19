import type React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCartIcon,
  PercentIcon,
  HandshakeIcon,
  CalculatorIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { numberFormat } from '@/lib/helpers/formatters';

interface DashboardStatsCardProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  stats: {
    last30Days: number;
    previous30Days: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'stable';
  };
  formatValue?: (value: number) => string;
  className?: string;
}

export function DashboardStatsCard({
  title,
  icon,
  description,
  stats,
  formatValue = value => numberFormat(value),
  className,
}: DashboardStatsCardProps) {
  const getTrendColor = () => {
    switch (stats.trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      //   case 'stable':
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      //   case 'stable':
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  //   const getTrendText = () => {
  //     const absChange = Math.abs(stats.percentageChange);
  //     if (stats.trend === 'stable' || absChange === 0) {
  //       return 'No change';
  //     }
  //     return `${absChange}% ${stats.trend === 'up' ? 'increase' : 'decrease'}`;
  //   };

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-6 text-card-foreground shadow-sm',
        className
      )}
    >
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium tracking-tight">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      <div className="flex items-baseline space-x-2">
        <div className="text-2xl font-bold">
          {formatValue(stats.last30Days)}
        </div>
        <div className={cn('flex items-center space-x-1', getTrendColor())}>
          {getTrendIcon()}
          <span className="text-xs font-medium">
            {Math.abs(stats.percentageChange)}%
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {/* <p className="text-xs text-muted-foreground">
          {getTrendText()} from previous period
        </p> */}
        {description && (
          <p className="text-xs text-muted-foreground truncate">
            {description}
          </p>
        )}
        {/* <p className="text-xs text-muted-foreground">
          Previous: {formatValue(stats.previous30Days)}
        </p> */}
      </div>
    </div>
  );
}

// Example usage component
export function DashboardStatsGrid({
  dashboardStats,
}: {
  dashboardStats: {
    revenue: {
      last30Days: number;
      previous30Days: number;
      percentageChange: number;
      trend: 'up' | 'down' | 'stable';
    };
    orders: {
      last30Days: number;
      previous30Days: number;
      percentageChange: number;
      trend: 'up' | 'down' | 'stable';
    };
    discountedAmount: {
      last30Days: number;
      previous30Days: number;
      percentageChange: number;
      trend: 'up' | 'down' | 'stable';
    };
    averageOrder: {
      last30Days: number;
      previous30Days: number;
      percentageChange: number;
      trend: 'up' | 'down' | 'stable';
    };
    lastUpdated: string;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardStatsCard
        title="Purchases"
        stats={dashboardStats.revenue}
        description="Total orders value"
        formatValue={value => `${numberFormat(value)}`}
        icon={<ShoppingCartIcon className="h-4 w-4" />}
      />

      <DashboardStatsCard
        title="Total Orders"
        stats={dashboardStats.orders}
        description="Number of orders placed"
        formatValue={value => numberFormat(value, 0)}
        icon={<CalculatorIcon className="h-4 w-4" />}
      />

      <DashboardStatsCard
        title="Discounted Amount"
        stats={dashboardStats.discountedAmount}
        description="Total discounts awarded"
        formatValue={value => `${numberFormat(value)}`}
        icon={<HandshakeIcon className="h-4 w-4" />}
      />

      <DashboardStatsCard
        title="Average Order Value"
        stats={dashboardStats.averageOrder}
        description="Average value per order"
        formatValue={value => `${numberFormat(value)}`}
        icon={<PercentIcon className="h-4 w-4" />}
      />
    </div>
  );
}
