'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDashboardPeriod } from '@/features/it/hooks/dashboard/use-period';
import { DASHBOARD_PERIOD_OPTIONS, type DashboardPeriod } from '@/lib/helpers/dates';

export function PeriodSelect() {
  const [period, setPeriod] = useDashboardPeriod();

  return (
    <Select
      value={period}
      onValueChange={value => setPeriod(value as DashboardPeriod)}
    >
      <SelectTrigger
        aria-label="Select dashboard period"
        className="w-full sm:w-56"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DASHBOARD_PERIOD_OPTIONS.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
