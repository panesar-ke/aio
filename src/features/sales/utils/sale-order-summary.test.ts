import { describe, expect, it } from 'vitest';

import { summariseSaleOrder } from '@/features/sales/utils/sale-order-summary';

const header = {
  amountExclusive: '110000.00',
  vatAmount: '17600.00',
  amountInclusive: '127600.00',
};

const lines = [
  { qty: '40', amount: '34000.00' },
  { qty: '120', amount: '74400.00' },
  { qty: '25', amount: '1600.00' },
];

describe('summariseSaleOrder', () => {
  it('sums quantities and gross value from the lines', () => {
    const summary = summariseSaleOrder(header, lines);

    expect(summary.totalItems).toBe(185);
    expect(summary.lineCount).toBe(3);
    expect(summary.grossTotal).toBe(110000);
  });

  it('takes the vat split and payable total from the stored header', () => {
    const summary = summariseSaleOrder(header, lines);

    expect(summary.exclusive).toBe(110000);
    expect(summary.vatAmount).toBe(17600);
    expect(summary.inclusive).toBe(127600);
  });

  it('does not recompute the header totals from the lines', () => {
    // An inclusive-VAT order's gross already contains the tax, so the gross
    // and the payable total legitimately differ from exclusive + vat.
    const summary = summariseSaleOrder(
      {
        amountExclusive: '100000.00',
        vatAmount: '16000.00',
        amountInclusive: '116000.00',
      },
      [{ qty: '10', amount: '116000.00' }],
    );

    expect(summary.grossTotal).toBe(116000);
    expect(summary.inclusive).toBe(116000);
    expect(summary.exclusive).toBe(100000);
  });

  it('handles an order with no lines', () => {
    const summary = summariseSaleOrder(header, []);

    expect(summary.totalItems).toBe(0);
    expect(summary.lineCount).toBe(0);
    expect(summary.grossTotal).toBe(0);
  });
});
