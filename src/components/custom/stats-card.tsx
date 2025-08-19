import type React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { numberFormat } from '@/lib/helpers/formatters';

interface StatsCardProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  value: number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  formatValue?: (value: number) => string;
  className?: string;
}

export function StatsCard({
  title,
  icon,
  description,
  value,
  trend,
  formatValue = val => numberFormat(val),
  className,
}: StatsCardProps) {
  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      case 'stable':
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

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
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {trend && (
          <div className={cn('flex items-center space-x-1', getTrendColor())}>
            {getTrendIcon()}
            <span className="text-xs font-medium">
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      )}
    </div>
  );
}

// Helper function to convert dashboard stats to StatsCard props
export const createStatsCardProps = (
  title: string,
  icon: React.ReactNode,
  description: string,
  stats: {
    last30Days: number;
    previous30Days: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'stable';
  },
  formatValue?: (value: number) => string
): StatsCardProps => ({
  title,
  icon,
  description,
  value: stats.last30Days,
  trend: {
    value: stats.percentageChange,
    direction: stats.trend,
  },
  formatValue,
});
