'use client';

import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createId } from '@paralleldrive/cuid2';
import axios, { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { Trash2Icon } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { Option } from '@/types/index.types';
import type { MaterialTransferFormValues } from '@/features/store/utils/store.types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { materialTransferFormSchema } from '@/features/store/utils/schema';
import { Input } from '@/components/ui/input';
import { dateFormat } from '@/lib/helpers/formatters';
import { MiniSelect } from '@/components/custom/mini-select';
import { FormActions } from '@/components/custom/form-actions';
import { SearchSelect } from '@/components/custom/search-select';
import { Button } from '@/components/ui/button';
import { createTransfer } from '@/features/store/services/transfers/actions';
import { ToastContent } from '@/components/custom/toast';
import type { getTransfer } from '@/features/store/services/transfers/data';

type Props = {
  stores: Array<Option>;
  products: Array<Option>;
  transfer?: NonNullable<Awaited<ReturnType<typeof getTransfer>>>;
};

export function TransferForm({ stores, products, transfer }: Props) {
  const form = useForm<MaterialTransferFormValues>({
    defaultValues: {
      fromStoreId: transfer?.fromStoreId || '',
      items:
        transfer?.materials?.map(
          ({ id, itemId, stockBalance, transferredQty, remarks }) => ({
            id,
            itemId,
            transferredQty: Number(transferredQty),
            stockBalance: Number(stockBalance),
            remarks: remarks ?? '',
          })
        ) || [],
      toStoreId: transfer?.toStoreId || '',
      transferDate: transfer?.transferDate || new Date(),
    },
    resolver: zodResolver(materialTransferFormSchema),
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(data: MaterialTransferFormValues) {
    const action = createTransfer;

    const res = await action(data);
    if (res.error) {
      toast.error(() => (
        <ToastContent message={res.message} title="Transfer Failed" />
      ));
      return;
    }
    form.reset();
  }
  return (
    <Form {...form}>
      <form
        className="space-y-4 bg-card p-6 shadow-sm rounded-md"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid md:grid-cols-3 gap-4 items-start">
          <FormField
            control={form.control}
            name="transferDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tranfer Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? dateFormat(field.value) : ''}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fromStoreId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store From</FormLabel>
                <FormControl>
                  <MiniSelect
                    options={stores}
                    {...field}
                    defaultValue={field.value}
                    placeholder="Select a store"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toStoreId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store To</FormLabel>
                <FormControl>
                  <MiniSelect
                    options={stores}
                    {...field}
                    defaultValue={field.value}
                    placeholder="Select a store"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <TransferDetails
          products={products}
          form={form}
          isPending={isPending}
        />
        <FormActions isPending={isPending} resetFn={form.reset} />
      </form>
    </Form>
  );
}

function TransferDetails({
  products,
  form,
  isPending,
}: {
  products: Array<Option>;
  form: UseFormReturn<MaterialTransferFormValues>;
  isPending: boolean;
}) {
  //   const { products: queryProducts } = useProcurementServices();
  const [items, fromStoreId, transferDate] = useWatch({
    control: form.control,
    name: ['items', 'fromStoreId', 'transferDate'],
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  async function handleProductCurrentBalance(value: string, i: number) {
    try {
      const response = await axios.get(
        `/api/products/${value}/current-balance?storeId=${
          fromStoreId || ''
        }&asOfDate=${transferDate || new Date()}`
      );
      const currentBalance = response.data.currentBalance;
      console.log('Current Balance:', currentBalance);
      form.setValue(`items.${i}.stockBalance`, currentBalance);
    } catch (error) {
      if (isAxiosError(error)) {
        const message = error.response?.data?.error || 'Unknown error';
        toast.error(message);
      } else {
        console.error(error);
        toast.error('Unknown error');
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto pb-4">
        <table
          className="w-full"
          style={{ minWidth: '1800px', tableLayout: 'fixed' }}
        >
          <thead>
            <tr className="border-b border-gray-200">
              <th
                className="text-left py-2 px-2 font-medium"
                style={{ width: '480px' }}
              >
                Product
              </th>
              <th
                className="text-left py-2 px-2 font-medium"
                style={{ width: '128px' }}
              >
                Current Stock
              </th>
              <th
                className="text-left py-2 px-2 font-medium"
                style={{ width: '128px' }}
              >
                Qty
              </th>
              <th
                className="text-left py-2 px-2 font-medium"
                style={{ width: '288px' }}
              >
                Remarks
              </th>
              <th
                className="text-centre py-2 px-2 font-medium"
                style={{ width: '128px' }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, index) => (
              <tr key={f.id} className="border-b border-gray-200">
                <td className="py-2 px-2" style={{ width: '480px' }}>
                  <FormField
                    control={form.control}
                    name={`items.${index}.itemId`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <SearchSelect
                            onChange={(value: string) => {
                              if (!value || value.trim().length === 0) {
                                return;
                              }

                              const productAlreadyAdded = items.some(
                                item => item.itemId === value
                              );
                              if (productAlreadyAdded) {
                                toast.error('Product already added');
                                return;
                              }
                              field.onChange(value);
                              handleProductCurrentBalance(value, index);
                            }}
                            value={field.value}
                            emptyText="Product not found"
                            placeholder="Select product"
                            isPending={isPending}
                            options={products}
                            searchText="Search product"
                          />
                        </FormItem>
                      );
                    }}
                  />
                </td>
                <td className="py-2 px-2" style={{ width: '128px' }}>
                  <FormField
                    control={form.control}
                    name={`items.${index}.stockBalance`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ''}
                              className="w-full"
                              disabled
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                </td>
                <td className="py-2 px-2" style={{ width: '128px' }}>
                  <FormField
                    control={form.control}
                    name={`items.${index}.transferredQty`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Qty"
                              {...field}
                              value={field.value || ''}
                              autoFocus={false}
                              className="w-full"
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                </td>

                <td className="py-2 px-2" style={{ width: '288px' }}>
                  <FormField
                    control={form.control}
                    name={`items.${index}.remarks`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Remarks"
                              {...field}
                              className="w-full"
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                </td>
                <td
                  className="py-2 px-2 text-center"
                  style={{ width: '128px' }}
                >
                  <Button
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => remove(index)}
                    type="button"
                    disabled={isPending}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="text-sm"
          type="button"
          onClick={() => {
            if (!fromStoreId || !transferDate) {
              return toast.error(
                'Please select From Store and Transfer Date first'
              );
            }
            append({
              id: createId(),
              itemId: '',
              stockBalance: 0,
              transferredQty: 0,
              remarks: '',
            });
          }}
          disabled={isPending}
        >
          Add lines
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-sm"
          onClick={() => form.setValue('items', [])}
          type="button"
          disabled={isPending}
        >
          Clear all lines
        </Button>
      </div>
    </div>
  );
}
