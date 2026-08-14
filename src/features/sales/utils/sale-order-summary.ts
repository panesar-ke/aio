import { toNumber } from '@/lib/helpers/numbers';

type SummaryHeader = {
  amountExclusive: string;
  vatAmount: string;
  amountInclusive: string;
};

type SummaryLine = {
  qty: string;
  amount: string;
};

/**
 * Derives the figures shown on the read-only views of a saved sale order.
 *
 * Line quantities and the gross value are summed from the lines, but the VAT
 * split and the payable total come straight off the header - those were
 * calculated and stored when the order was saved, and recomputing them here
 * would risk drifting from what the customer was quoted.
 */
export function summariseSaleOrder(
  header: SummaryHeader,
  lines: Array<SummaryLine>,
) {
  let totalItems = 0;
  let grossTotal = 0;

  for (const line of lines) {
    totalItems += toNumber(line.qty);
    grossTotal += toNumber(line.amount);
  }

  return {
    totalItems,
    lineCount: lines.length,
    grossTotal,
    exclusive: toNumber(header.amountExclusive),
    vatAmount: toNumber(header.vatAmount),
    inclusive: toNumber(header.amountInclusive),
  };
}
