import { queryOptions, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import type { Option } from '@/types/index.types';

import { FormSectionHeader } from '@/components/custom/form-header';
import { notify } from '@/components/custom/toast';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SelectItem } from '@/components/ui/select';
import { saleOrderFormOpts } from '@/features/sales/utils/form';
import { formatSaleOrderNo } from '@/features/sales/utils/sale-order-format';
import { withForm } from '@/lib/form';

// Routed through our own API so the provider key stays on the server - a
// NEXT_PUBLIC_ key is inlined into the client bundle and readable by anyone.
const exchangeRateOptions = () =>
  queryOptions({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const res = await fetch('/api/exchange-rates');
      if (!res.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      const data: { kesPerUsd: number } = await res.json();
      return data.kesPerUsd;
    },
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 60 * 1000,
  });

export const SaleOrderHeader = withForm({
  ...saleOrderFormOpts(),
  props: {
    accounts: [] as Array<Option>,
    orderPreviewNo: 1 as number,
    orderDate: undefined as string | undefined,
  },
  render: function Render({ form, accounts, orderPreviewNo, orderDate }) {
    const queryClient = useQueryClient();
    useEffect(
      function () {
        queryClient.prefetchQuery(exchangeRateOptions());
      },
      [queryClient],
    );
    // Existing orders keep the year they were raised in; a new order has not
    // been allocated a number yet, so it previews against the current year.
    const orderNo = useMemo(
      () => formatSaleOrderNo(orderPreviewNo, orderDate),
      [orderPreviewNo, orderDate],
    );
    return (
      <section className='bg-card border rounded-lg shadow-sm overflow-hidden'>
        <FormSectionHeader
          title='Order Header'
          description='Customer and document details for this order.'
        />
        <FieldGroup className='grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3'>
          <Field>
            <FieldLabel>Order No</FieldLabel>
            <Input readOnly value={orderNo} />
          </Field>
          <form.AppField name='orderDate'>
            {(field) => <field.Input type='date' label='Order Date' required />}
          </form.AppField>
          <form.AppField name='accountId'>
            {(field) => (
              <field.Combobox
                label='Account'
                items={accounts}
                placeholder='Select Account'
                required
                searchPlaceholder='Search Account'
                emptyMessage='No Account found'
              />
            )}
          </form.AppField>
        </FieldGroup>
        <FieldGroup className='grid grid-cols-1 gap-6 p-5 sm:grid-cols-3 pt-0'>
          <form.AppField
            name='vatType'
            listeners={{
              onChange: ({ value, fieldApi }) => {
                if (value === 'NONE') {
                  fieldApi.form.setFieldValue('vatRate', undefined);
                }
              },
            }}
          >
            {(field) => (
              <field.Select
                label='VAT Type'
                required
                placeholder='Select VAT Type'
              >
                <SelectItem value='NONE'>None</SelectItem>
                <SelectItem value='INCLUSIVE'>Inclusive</SelectItem>
                <SelectItem value='EXCLUSIVE'>Exclusive</SelectItem>
              </field.Select>
            )}
          </form.AppField>
          <form.Subscribe selector={(state) => state.values.vatType}>
            {(vatType) => (
              <form.AppField name='vatRate'>
                {(field) => (
                  <field.Select
                    label='VAT Rate'
                    required={vatType !== 'NONE'}
                    disabled={vatType === 'NONE'}
                    placeholder='Select VAT'
                  >
                    <SelectItem value='16'>16%</SelectItem>
                  </field.Select>
                )}
              </form.AppField>
            )}
          </form.Subscribe>
        </FieldGroup>
        <FieldGroup className='grid grid-cols-1 gap-6 p-5 sm:grid-cols-3 pt-0'>
          <form.AppField
            name='currency'
            listeners={{
              onChange: async ({ value, fieldApi }) => {
                if (value === 'KES') {
                  fieldApi.form.setFieldValue('exchangeRate', 1);
                  return;
                }
                try {
                  const rate = await queryClient.fetchQuery(
                    exchangeRateOptions(),
                  );
                  if (typeof rate !== 'number' || !Number.isFinite(rate)) {
                    throw new Error('Missing KES conversion rate');
                  }
                  fieldApi.form.setFieldValue('exchangeRate', rate);
                } catch {
                  notify.error(
                    'Exchange rate unavailable',
                    'Enter the exchange rate manually.',
                  );
                  fieldApi.form.setFieldValue('exchangeRate', undefined);
                }
              },
            }}
          >
            {(field) => (
              <field.Select
                label='Currency'
                required
                placeholder='Select Currency'
              >
                <SelectItem value='KES'>KES</SelectItem>
                <SelectItem value='USD'>USD</SelectItem>
              </field.Select>
            )}
          </form.AppField>
          <form.Subscribe selector={(state) => state.values.currency}>
            {(currency) => (
              <form.AppField name='exchangeRate'>
                {(field) => (
                  <field.Input
                    disabled={currency === 'KES'}
                    type='number'
                    label='Exchange Rate'
                    required
                  />
                )}
              </form.AppField>
            )}
          </form.Subscribe>
        </FieldGroup>
      </section>
    );
  },
});
