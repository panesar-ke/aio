import { parseAsStringEnum, useQueryState } from 'nuqs';

import {
  DASHBOARD_PERIODS,
  type DashboardPeriod,
  DEFAULT_DASHBOARD_PERIOD,
} from '@/lib/helpers/dates';

export function useDashboardPeriod() {
  return useQueryState(
    'period',
    parseAsStringEnum<DashboardPeriod>([...DASHBOARD_PERIODS]).withDefault(
      DEFAULT_DASHBOARD_PERIOD,
    ),
  );
}
