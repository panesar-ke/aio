import type { SaleOrderFormValues } from '@/features/sales/utils/schemas';

import { toNumber } from '@/lib/helpers/numbers';

type SaleOrderHeaderRow = {
  id: number;
  dateRaised: string;
  accountId: string | null;
  vatType: SaleOrderFormValues['vatType'];
  vatRate: string;
  currency: string;
  conversionRate: string;
};

type SaleOrderLineRow = {
  id: number;
  item: string;
  qty: string;
  rate: string;
  category: string | null;
};

/**
 * Maps a persisted sale order onto the shape the form works with.
 *
 * Numeric columns come back as strings from postgres, and the form schema
 * expects `vatRate` to be absent (not 0) whenever the VAT type is NONE - the
 * superRefine rejects a rate that is present alongside NONE.
 */
export function toSaleOrderFormValues(
  header: SaleOrderHeaderRow,
  lines: Array<SaleOrderLineRow>,
): SaleOrderFormValues {
  return {
    id: header.id.toString(),
    orderDate: header.dateRaised,
    accountId: header.accountId ?? '',
    vatType: header.vatType,
    vatRate: header.vatType === 'NONE' ? undefined : toNumber(header.vatRate),
    currency: header.currency === 'USD' ? 'USD' : 'KES',
    exchangeRate: toNumber(header.conversionRate) || 1,
    details: lines.map((line) => ({
      id: line.id.toString(),
      item: line.item,
      qty: toNumber(line.qty),
      rate: toNumber(line.rate),
      category: line.category ?? '',
    })),
  };
}
