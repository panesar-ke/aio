'use client';
import { useSelector } from '@tanstack/react-form';
import { SaveIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import type { SaleOrderFormValues } from '@/features/sales/utils/schemas';
import type { Option } from '@/types/index.types';

import { FooterFormActions } from '@/components/custom/form-actions';
import { notify } from '@/components/custom/toast';
import {
  calculateOrderSummary,
  SaleOrderSummary,
} from '@/features/sales/components/orders/order-summary';
import { SaleOrderDetails } from '@/features/sales/components/orders/sale-order-details';
import { SaleOrderHeader } from '@/features/sales/components/orders/sale-order-header';
import { upsertSaleOrder } from '@/features/sales/services/orders/actions';
import { saleOrderFormOpts } from '@/features/sales/utils/form';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';
import { numberFormat } from '@/lib/helpers/formatters';

type PageProps = {
  accounts: Array<Option>;
  saleOrderPreviewNo: number;
  order?: SaleOrderFormValues;
  account?: string | null;
};
export function SalesOrderForm({
  accounts,
  saleOrderPreviewNo,
  order,
  account,
}: PageProps) {
  const router = useRouter();
  const formOpts = useMemo(
    () => saleOrderFormOpts(order, account),
    [order, account],
  );
  const isEditing = Boolean(order?.id);
  const form = useAppForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      if (value.details.length === 0) {
        notify.error(
          'Failed Validation',
          'At least one item should be added to the order',
        );
        return;
      }
      await handleSubmitFeedback({
        action: () => upsertSaleOrder(value),
        errorTitle: 'Failed to save order',
        successTitle: 'Order saved',
        fallbackMessage: 'Failed to save the order. Please try again.',
        onSuccess: () => {
          if (isEditing) {
            router.push(`/sales/orders/${order?.id}/details`);
            return;
          }
          form.reset();
          router.push(`/sales/orders`);
        },
      });
    },
  });
  const [isSubmitting] = useSelector(form.store, (state) => [
    state.isSubmitting,
  ]);

  useEffect(() => {
    form.reset();
  }, [form]);

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className='flex-1 space-y-6 overflow-y-auto pb-6'
      >
        <SaleOrderHeader
          form={form}
          accounts={accounts}
          orderPreviewNo={saleOrderPreviewNo}
          orderDate={order?.orderDate}
        />
        <SaleOrderDetails form={form} />
        <SaleOrderSummary form={form} />
      </form>
      <FooterFormActions
        formSummary={
          <form.Subscribe
            selector={(state) => {
              const { details, vatType, vatRate } = state.values;
              return {
                lineCount: details.length,
                total: calculateOrderSummary({ details, vatType, vatRate })
                  .inclusive,
                currency: state.values.currency,
              };
            }}
          >
            {({ lineCount, total, currency }) => (
              <p className='text-xs text-muted-foreground'>
                {lineCount} {lineCount === 1 ? 'line' : 'lines'} &mdash;{' '}
                {currency} {numberFormat(total)}
              </p>
            )}
          </form.Subscribe>
        }
        isSubmitting={isSubmitting}
        saveIcon={SaveIcon}
        handleSubmit={form.handleSubmit}
        handleReset={form.reset}
      />
    </div>
  );
}
