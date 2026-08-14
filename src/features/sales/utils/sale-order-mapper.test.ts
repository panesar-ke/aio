import { describe, expect, it } from 'vitest';

import { toSaleOrderFormValues } from '@/features/sales/utils/sale-order-mapper';
import { saleOrderFormSchema } from '@/features/sales/utils/schemas';

const header = {
  id: 1098,
  dateRaised: '2026-08-13',
  accountId: 'ecd4a2b0-0f6e-4c5f-9f1a-7f4c1d2b3a44',
  vatType: 'EXCLUSIVE' as const,
  vatRate: '16',
  currency: 'KES',
  conversionRate: '1',
};

const lines = [
  {
    id: 5,
    item: 'Portland Cement',
    qty: '40',
    rate: '850.00',
    category: 'joinery',
  },
  {
    id: 6,
    item: 'Binding Wire',
    qty: '25',
    rate: '410.50',
    category: 'tables',
  },
];

const linesWithGaps = [
  { id: 7, item: 'Binding Wire', qty: '25', rate: '410.50', category: null },
];

describe('toSaleOrderFormValues', () => {
  it('converts postgres numeric strings into numbers', () => {
    const values = toSaleOrderFormValues(header, lines);

    expect(values.vatRate).toBe(16);
    expect(values.exchangeRate).toBe(1);
    expect(values.details[0].qty).toBe(40);
    expect(values.details[0].rate).toBe(850);
    expect(values.details[1].rate).toBe(410.5);
  });

  it('stringifies ids so they satisfy the form schema', () => {
    const values = toSaleOrderFormValues(header, lines);

    expect(values.id).toBe('1098');
    expect(values.details.map((d) => d.id)).toEqual(['5', '6']);
  });

  it('omits the vat rate when the vat type is NONE', () => {
    const values = toSaleOrderFormValues(
      { ...header, vatType: 'NONE', vatRate: '0' },
      lines,
    );

    expect(values.vatRate).toBeUndefined();
  });

  it('falls back to empty strings for nullable columns the form requires', () => {
    const values = toSaleOrderFormValues(
      { ...header, accountId: null },
      linesWithGaps,
    );

    expect(values.accountId).toBe('');
    expect(values.details[0].category).toBe('');
  });

  it('loads an order with gaps but refuses to submit until they are filled', () => {
    // Older rows predate the required account/category fields. They must still
    // open in the form, and the schema must then force the user to complete
    // them rather than silently saving blanks.
    const values = toSaleOrderFormValues(
      { ...header, accountId: null },
      linesWithGaps,
    );
    const result = saleOrderFormSchema.safeParse(values);

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual([
      'accountId',
      'details.0.category',
    ]);
  });

  it('defaults a missing exchange rate to 1', () => {
    const values = toSaleOrderFormValues(
      { ...header, conversionRate: '0' },
      lines,
    );

    expect(values.exchangeRate).toBe(1);
  });

  it('narrows an unexpected currency back to KES', () => {
    const values = toSaleOrderFormValues({ ...header, currency: 'GBP' }, lines);

    expect(values.currency).toBe('KES');
  });

  it('produces values the form schema accepts', () => {
    const values = toSaleOrderFormValues(header, lines);
    const result = saleOrderFormSchema.safeParse(values);

    expect(result.success).toBe(true);
  });

  it('produces values the form schema accepts for a NONE vat order', () => {
    const values = toSaleOrderFormValues(
      { ...header, vatType: 'NONE', vatRate: '0' },
      lines,
    );
    const result = saleOrderFormSchema.safeParse(values);

    expect(result.success).toBe(true);
  });
});
