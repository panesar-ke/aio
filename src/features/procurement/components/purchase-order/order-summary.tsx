import type { OrderFormInput } from '@/features/procurement/utils/procurement.types';

import {
  calculateDiscount,
  calculateVatValues,
} from '@/features/procurement/utils/calculators';
import { purchaseOrderFormOpts } from '@/features/procurement/utils/form';
import { withForm } from '@/lib/form';
import { numberFormat } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

export function calculateOrderSummary({
  details,
  vatType,
  vat,
}: Pick<OrderFormInput, 'details' | 'vatType' | 'vat'>) {
  let totalItems = 0;
  let grossTotal = 0;
  let subTotal = 0;

  for (const line of details) {
    const qty = Number(line.qty) || 0;
    const rate = Number(line.rate) || 0;
    const gross = qty * rate;
    const discounted = calculateDiscount(
      line.discountType ?? 'NONE',
      Number(line.discount) || 0,
      gross
    );

    totalItems += qty;
    grossTotal += gross;
    subTotal += gross - discounted;
  }

  const discount = grossTotal - subTotal;
  const vatValues = calculateVatValues(vatType, subTotal, Number(vat) || 0);

  return {
    totalItems,
    grossTotal,
    discount,
    subTotal,
    ...vatValues,
  };
}

interface SummaryRowProps {
  label: string;
  value: string | number;
  isTotal?: boolean;
}

function SummaryRow({ label, value, isTotal }: SummaryRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-border/50 py-2.5 text-sm last:border-b-0',
        isTotal && 'border-b-0'
      )}
    >
      <span
        className={cn(
          'text-muted-foreground',
          isTotal && 'font-semibold text-foreground'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'font-medium tabular-nums',
          isTotal && 'text-base font-bold text-primary'
        )}
      >
        {value}
      </span>
    </div>
  );
}

export const OrderSummary = withForm({
  ...purchaseOrderFormOpts(),
  render: function Render({ form }) {
    return (
      <section className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">
            Summary
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Totals recalculate automatically as lines change.
          </p>
        </div>
        <form.Subscribe
          selector={state => ({
            details: state.values.details,
            vatType: state.values.vatType,
            vat: state.values.vat,
          })}
        >
          {values => {
            const summary = calculateOrderSummary(values);
            return (
              <div className="grid grid-cols-1 gap-x-8 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <SummaryRow label="Total Items" value={summary.totalItems} />
                  <SummaryRow
                    label="Gross Value"
                    value={`Ksh ${numberFormat(summary.grossTotal)}`}
                  />
                </div>
                <div>
                  <SummaryRow
                    label="Discounted Amount"
                    value={`Ksh ${numberFormat(summary.discount)}`}
                  />
                  <SummaryRow
                    label="Sub Total"
                    value={`Ksh ${numberFormat(summary.subTotal)}`}
                  />
                </div>
                <div>
                  <SummaryRow
                    label="Amount Exclusive"
                    value={`Ksh ${numberFormat(summary.exclusive)}`}
                  />
                  <SummaryRow
                    label="VAT"
                    value={`Ksh ${numberFormat(summary.vatValue)}`}
                  />
                </div>
                <div>
                  <SummaryRow
                    label="Amount Inclusive"
                    value={`Ksh ${numberFormat(summary.inclusive)}`}
                    isTotal
                  />
                </div>
              </div>
            );
          }}
        </form.Subscribe>
      </section>
    );
  },
});
