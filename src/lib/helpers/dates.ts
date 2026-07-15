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
