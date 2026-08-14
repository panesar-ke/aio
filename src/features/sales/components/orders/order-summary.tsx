import type { SaleOrderFormValues } from '@/features/sales/utils/schemas';

import { calculateVatValues } from '@/features/procurement/utils/calculators';
import { saleOrderFormOpts } from '@/features/sales/utils/form';
import { formatSaleOrderAmount } from '@/features/sales/utils/sale-order-format';
import { withForm } from '@/lib/form';
import { cn } from '@/lib/utils';

export function calculateOrderSummary({
  details,
  vatType,
  vatRate,
}: Pick<SaleOrderFormValues, 'details' | 'vatType' | 'vatRate'>) {
  let totalItems = 0;
  let grossTotal = 0;
  let subTotal = 0;

  for (const line of details) {
    const qty = Number(line.qty) || 0;
    const rate = Number(line.rate) || 0;
    const gross = qty * rate;

    totalItems += qty;
    grossTotal += gross;
    subTotal += gross;
  }

  const discount = grossTotal - subTotal;
  const vatValues = calculateVatValues(vatType, subTotal, Number(vatRate) || 0);

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
        isTotal && 'border-b-0',
      )}
    >
      <span
        className={cn(
          'text-muted-foreground',
          isTotal && 'font-semibold text-foreground',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'font-medium tabular-nums',
          isTotal && 'text-base font-bold text-primary',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export const SaleOrderSummary = withForm({
  ...saleOrderFormOpts(),
  render: function Render({ form }) {
    return (
      <section className='bg-card border rounded-lg shadow-sm overflow-hidden'>
        <div className='border-b px-5 py-4'>
          <h2 className='text-sm font-semibold text-card-foreground'>
            Summary
          </h2>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Totals recalculate automatically as lines change.
          </p>
        </div>
        <form.Subscribe
          selector={(state) => ({
            details: state.values.details,
            vatType: state.values.vatType,
            vatRate: state.values.vatRate,
            currency: state.values.currency,
          })}
        >
          {({ currency, ...values }) => {
            const summary = calculateOrderSummary(values);
            const money = (amount: number) =>
              formatSaleOrderAmount(currency, amount);
            return (
              <div className='grid grid-cols-1 gap-x-8 p-5 sm:grid-cols-2 lg:grid-cols-4'>
                <div>
                  <SummaryRow label='Total Items' value={summary.totalItems} />
                  <SummaryRow
                    label='Gross Value'
                    value={money(summary.grossTotal)}
                  />
                </div>
                <div>
                  <SummaryRow
                    label='Amount Exclusive'
                    value={money(summary.exclusive)}
                  />
                  <SummaryRow label='VAT' value={money(summary.vatValue)} />
                </div>
                <div>
                  <SummaryRow
                    label='Amount Inclusive'
                    value={money(summary.inclusive)}
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
