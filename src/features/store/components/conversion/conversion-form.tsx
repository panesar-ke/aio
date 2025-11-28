'use client';
import type { Option } from '@/types/index.types';
import {
  useFieldArray,
  useForm,
  type UseFormReturn,
  useWatch,
} from 'react-hook-form';
import { createId } from '@paralleldrive/cuid2';
import type { ConversionFormValues } from '@/features/store/utils/store.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { conversionSchema } from '@/features/store/utils/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { dateFormat } from '@/lib/helpers/formatters';
import { SearchSelect } from '@/components/custom/search-select';
import axios, { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Trash2Icon } from 'lucide-react';
import { FormActions } from '@/components/custom/form-actions';
import { ToastContent } from '@/components/custom/toast';
import { createConversion } from '@/features/store/services/conversions/action';

export function ConversionForm({
  products,
  mainStore,
}: {
  products: Array<Option>;
  mainStore: Option;
}) {
  const form = useForm<ConversionFormValues>({
    defaultValues: {
      conversionDate: new Date(),
      finalProduct: '',
      convertedQty: 0,
      convertingItems: [],
    },
    resolver: zodResolver(conversionSchema),
  });

  async function onSubmit(data: ConversionFormValues) {
    const action = createConversion;

    const res = await action(data);

    if (res.error) {
      toast.error(() => (
        <ToastContent
          title={`Error creating conversion!`}
          message={res.message}
        />
      ));
      return;
    }
    toast.success(() => (
      <ToastContent
        title={`Conversion created successfully!`}
        message={res.message}
      />
    ));
    form.reset();
  }

  const isPending = form.formState.isSubmitting;
  return (
    <Form {...form}>
      <form
        className="grid lg:grid-cols-12 gap-4 p-6 bg-card rounded-md shadow-sm"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="conversionDate"
          render={({ field }) => (
            <FormItem className="col-span-4">
              <FormLabel>Conversion Date</FormLabel>
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
          name="finalProduct"
          render={({ field }) => (
            <FormItem className="col-span-6">
              <FormLabel>Final Product</FormLabel>
              <FormControl>
                <SearchSelect
                  onChange={field.onChange}
                  value={field.value}
                  emptyText="Product not found"
                  placeholder="Select product"
                  isPending={isPending}
                  options={products}
                  searchText="Search product"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="convertedQty"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Converted Quantity</FormLabel>
              <FormControl>
                <Input {...field} value={field.value} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ConvertingItems
          form={form}
          mainStore={mainStore}
          isPending={isPending}
          products={products}
        />
        <FormActions
          className="col-span-full"
          isPending={isPending}
          resetFn={form.reset}
        />
      </form>
    </Form>
  );
}

function ConvertingItems({
  form,
  isPending,
  products,
  mainStore,
}: {
  form: UseFormReturn<ConversionFormValues>;
  isPending: boolean;
  products: Array<Option>;
  mainStore: Option;
}) {
  const [items, conversionDate] = useWatch({
    control: form.control,
    name: ['convertingItems', 'conversionDate'],
  });
  const { fields, remove, append } = useFieldArray({
    control: form.control,
    name: 'convertingItems',
  });

  async function handleProductCurrentBalance(value: string, i: number) {
    try {
      const response = await axios.get(
        `/api/products/${value}/current-balance?storeId=${
          mainStore.value || ''
        }&asOfDate=${conversionDate || new Date()}`
      );
      const currentBalance = response.data.currentBalance;
      form.setValue(`convertingItems.${i}.stockBalance`, currentBalance);
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
    <div className="space-y-2 col-span-full">
      <div className="overflow-x-auto pb-4">
        <table
          className="w-full"
          style={{ minWidth: '1800px', tableLayout: 'fixed' }}
        >
          <thead>
            <tr className="border-b border-gray-200">
              <th
                className="text-left py-2 px-2 font-medium"
                style={{ width: '380px' }}
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
                <td className="py-2 px-2" style={{ width: '380px' }}>
                  <FormField
                    control={form.control}
                    name={`convertingItems.${index}.itemId`}
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
                    name={`convertingItems.${index}.stockBalance`}
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
                    name={`convertingItems.${index}.convertingQty`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <FormControl>
                            <Input
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
                    name={`convertingItems.${index}.remarks`}
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
            if (!mainStore.value || !conversionDate) {
              return toast.error(
                'Please select From Store and Transfer Date first'
              );
            }
            append({
              id: createId(),
              itemId: '',
              convertingQty: 0,
              stockBalance: 0,
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
          onClick={() => form.setValue('convertingItems', [])}
          type="button"
          disabled={isPending}
        >
          Clear all lines
        </Button>
      </div>
    </div>
  );
}
