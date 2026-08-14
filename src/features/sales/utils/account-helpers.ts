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

/**
 * Formats an aggregate that has already been converted to local currency.
 *
 * Only for figures summed across orders (total spend, average order value),
 * which are always KES by construction. A single order's amount must use
 * `formatSaleOrderAmount` with that order's own currency instead.
 */
export function formatCurrency(amount: number | string) {
  return `KES ${numberFormat(amount, 0)}`;
}
