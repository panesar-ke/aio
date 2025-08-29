import { format, parse } from 'date-fns';
import type { Option } from '@/types/index.types';

export const titleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

export function getInitials(name: string) {
  const names = name.split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return names[0].charAt(0).toUpperCase() + names[1].charAt(0).toUpperCase();
}

export const dateFormat = (
  date: Date | string,
  formattingType: 'regular' | 'reporting' | 'long' = 'regular'
) => {
  const isDateOnly =
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (formattingType === 'regular' && isDateOnly) return date as string;
  const d = isDateOnly
    ? parse(date as string, 'yyyy-MM-dd', new Date())
    : new Date(date);
  if (formattingType === 'reporting') return format(d, 'dd/MM/yyyy');
  if (formattingType === 'long') return format(d, 'PPP');
  return format(d, 'yyyy-MM-dd');
};

export const formatDateReporting = (date: Date | string) => {
  return format(new Date(date), 'dd/MM/yyyy');
};

export const extractValue = (value: string) => {
  return value.split('-')[0];
};

export const extractSelectedText = (value: string) => {
  return value.split('-')[1];
};

export function numberFormat(
  number: string | number,
  minimumFractionDigits = 2
) {
  return new Intl.NumberFormat('en-KE', {
    maximumFractionDigits: 2,
    minimumFractionDigits,
  }).format(Number(number));
}

export const compactNumberFormatter = (value: string | number) => {
  return new Intl.NumberFormat('en-KE', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(Number(value));
};

export const fileSuffix = () => {
  return format(new Date(), 'ddMMyyyyhhmmss');
};

export function transformOptions(
  data: Array<Record<string, string | number>>,
  valueField = 'id',
  labelField = 'name'
): Array<Option> {
  return data.map(item => ({
    value: item[valueField].toString(),
    label: item[labelField].toString().toUpperCase(),
  }));
}

export function reportCaseFormatter(value: string) {
  const result = value.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}
