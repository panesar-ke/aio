import { format, parse } from 'date-fns';

import { numberFormat } from '@/lib/helpers/formatters';

export function getDateValue(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? parse(date, 'yyyy-MM-dd', new Date())
    : new Date(date);
}

export function buildSalesOrderLabel(saleOrderNo: number, dateRaised: string) {
  return `SO-${getDateValue(dateRaised).getFullYear()}-${saleOrderNo}`;
}

export function formatTableDate(date: string) {
  return format(getDateValue(date), 'dd MMM yyyy').toUpperCase();
}

export function formatCurrency(amount: number | string) {
  return `KES ${numberFormat(amount, 0)}`;
}
