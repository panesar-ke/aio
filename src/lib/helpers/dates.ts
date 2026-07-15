import { type Option } from '@/types/index.types';

type FinancialYearRange = {
  currentYear: { from: Date; to: Date };
  previousYear: { from: Date; to: Date };
};

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function getFinancialYearStart(date?: Date): number {
  const ref = date ?? new Date();
  const year = ref.getFullYear();
  const month = ref.getMonth();

  return month >= 4 ? year : year - 1;
}

export function getFinancialYearRanges(date?: Date): FinancialYearRange {
  const ref = date ?? new Date();
  const fyStartYear = getFinancialYearStart(ref);

  const currentYearFrom = new Date(fyStartYear, 4, 1);
  const currentYearTo = ref;

  const previousYearFrom = new Date(fyStartYear - 1, 4, 1);
  const previousYearTo = new Date(fyStartYear, 3, 30);

  return {
    currentYear: { from: currentYearFrom, to: currentYearTo },
    previousYear: { from: previousYearFrom, to: previousYearTo },
  };
}

export function getFinancialYearMonths(
  fyStartYear: number
): Array<{ date: Date; label: string }> {
  return Array.from({ length: 12 }, (_, index) => {
    const monthIndex = (4 + index) % 12; // 4 = May
    const year = fyStartYear + (4 + index >= 12 ? 1 : 0);
    const date = new Date(year, monthIndex, 1);

    return { date, label: `${MONTH_LABELS[monthIndex]} ${year}` };
  });
}

export function getFinancialYearLabel(fyStartYear: number): string {
  return `${fyStartYear}/${fyStartYear + 1}`;
}

export function getFinancialYearOptions(
  back = 2,
  forward = 1
): Array<Option> {
  const currentFyStart = getFinancialYearStart();

  return Array.from({ length: back + forward + 1 }, (_, index) => {
    const fyStartYear = currentFyStart - back + index;

    return {
      value: fyStartYear.toString(),
      label: getFinancialYearLabel(fyStartYear),
    };
  }).reverse();
}

export const DASHBOARD_PERIODS = [
  'current',
  'q1',
  'q2',
  'q3',
  'q4',
  'previous',
] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriod = 'current';

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, string> = {
  current: 'Current Year',
  q1: 'Q1 (May–July)',
  q2: 'Q2 (Aug–Oct)',
  q3: 'Q3 (Nov–Jan)',
  q4: 'Q4 (Feb–Apr)',
  previous: 'Previous Year',
};

export const DASHBOARD_PERIOD_OPTIONS: Array<Option> = DASHBOARD_PERIODS.map(
  period => ({
    value: period,
    label: DASHBOARD_PERIOD_LABELS[period],
  })
);

export function isDashboardPeriod(value: string): value is DashboardPeriod {
  return (DASHBOARD_PERIODS as ReadonlyArray<string>).includes(value);
}

/**
 * total actual expenses in the selected range ÷ number of financial-year
 * months represented by that range. Zero when either side is zero.
 */
export function calculateAverageMonthlySpend(
  totalSpent: number,
  monthsInPeriod: number
): number {
  if (!monthsInPeriod || !totalSpent) return 0;
  return totalSpent / monthsInPeriod;
}

/**
 * Number of financial-year calendar months reached from May through the
 * month of `referenceDate`, inclusive of the current partial month.
 */
export function getMonthsElapsedInFinancialYear(
  referenceDate: Date = new Date()
): number {
  const month = referenceDate.getMonth();
  return ((month - 4 + 12) % 12) + 1;
}

export type DashboardPeriodRange = {
  from: Date;
  toExclusive: Date;
  monthsInPeriod: number;
  financialYearStart: number;
};

/**
 * Half-open [from, toExclusive) date range for a dashboard period, plus the
 * number of financial-year months it represents (used for average-monthly
 * calculations) and the it_budgets.financialYearStart it belongs to.
 */
export function getDashboardPeriodRange(
  period: DashboardPeriod,
  referenceDate: Date = new Date()
): DashboardPeriodRange {
  const fyStartYear = getFinancialYearStart(referenceDate);

  switch (period) {
    case 'current': {
      const from = new Date(fyStartYear, 4, 1);
      const fyEndExclusive = new Date(fyStartYear + 1, 4, 1);
      const dayAfterReference = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate() + 1
      );

      return {
        from,
        toExclusive:
          dayAfterReference < fyEndExclusive
            ? dayAfterReference
            : fyEndExclusive,
        monthsInPeriod: getMonthsElapsedInFinancialYear(referenceDate),
        financialYearStart: fyStartYear,
      };
    }
    case 'q1':
      return {
        from: new Date(fyStartYear, 4, 1),
        toExclusive: new Date(fyStartYear, 7, 1),
        monthsInPeriod: 3,
        financialYearStart: fyStartYear,
      };
    case 'q2':
      return {
        from: new Date(fyStartYear, 7, 1),
        toExclusive: new Date(fyStartYear, 10, 1),
        monthsInPeriod: 3,
        financialYearStart: fyStartYear,
      };
    case 'q3':
      return {
        from: new Date(fyStartYear, 10, 1),
        toExclusive: new Date(fyStartYear + 1, 1, 1),
        monthsInPeriod: 3,
        financialYearStart: fyStartYear,
      };
    case 'q4':
      return {
        from: new Date(fyStartYear + 1, 1, 1),
        toExclusive: new Date(fyStartYear + 1, 4, 1),
        monthsInPeriod: 3,
        financialYearStart: fyStartYear,
      };
    case 'previous':
      return {
        from: new Date(fyStartYear - 1, 4, 1),
        toExclusive: new Date(fyStartYear, 4, 1),
        monthsInPeriod: 12,
        financialYearStart: fyStartYear - 1,
      };
  }
}

/**
 * The same period definition, shifted back exactly one financial year —
 * used as the comparison baseline for "vs previous period" deltas. Reuses
 * `getDashboardPeriodRange` by shifting the reference date back a year
 * rather than duplicating the range rules.
 */
export function getDashboardComparisonPeriodRange(
  period: DashboardPeriod,
  referenceDate: Date = new Date()
): DashboardPeriodRange {
  const oneYearEarlier = new Date(
    referenceDate.getFullYear() - 1,
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  return getDashboardPeriodRange(period, oneYearEarlier);
}

const PERIOD_MONTH_INDEX_RANGES: Record<
  'q1' | 'q2' | 'q3' | 'q4',
  [number, number]
> = {
  q1: [0, 3],
  q2: [3, 6],
  q3: [6, 9],
  q4: [9, 12],
};

/**
 * The financial-year month list (from `getFinancialYearMonths`) sliced down
 * to whichever months the given period actually covers, so chart callers
 * never need their own month-range logic.
 */
export function getFinancialYearMonthsForPeriod(
  period: DashboardPeriod,
  referenceDate: Date = new Date()
): Array<{ date: Date; label: string }> {
  const fyStartYear = getFinancialYearStart(referenceDate);

  if (period === 'previous') {
    return getFinancialYearMonths(fyStartYear - 1);
  }

  const months = getFinancialYearMonths(fyStartYear);

  if (period === 'current') {
    return months.slice(0, getMonthsElapsedInFinancialYear(referenceDate));
  }

  const [start, end] = PERIOD_MONTH_INDEX_RANGES[period];
  return months.slice(start, end);
}
