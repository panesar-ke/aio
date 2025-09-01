'use client';

import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
// import axios, { isAxiosError } from 'axios';
import { createId } from '@paralleldrive/cuid2';
import { Trash2Icon } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { Option } from '@/types/index.types';
import type { MaterialIssueFormValues } from '@/features/store/utils/store.types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { materialIssueFormSchema } from '@/features/store/utils/schema';
import { Input } from '@/components/ui/input';
import { MiniSelect } from '@/components/custom/mini-select';
import { Button } from '@/components/ui/button';
import { SearchSelect } from '@/components/custom/search-select';
import {
  createIssue,
  updateIssue,
} from '@/features/store/services/issues/actions';
import { ToastContent } from '@/components/custom/toast';
import { dateFormat } from '@/lib/helpers/formatters';
import { FormActions } from '@/components/custom/form-actions';
import type { getMaterialIssue } from '@/features/store/services/issues/data';

type Props = {
  stores: Array<Option>;
  products: Array<Option>;
  issueNo: number;
  issue?: NonNullable<Awaited<ReturnType<typeof getMaterialIssue>>>;
};

export function IssueMaterialForm({ products, stores, issueNo, issue }: Props) {
  const form = useForm<MaterialIssueFormValues>({
    defaultValues: {
      issueNo,
      jobcardNo: issue?.jobcardNo || '',
      staffIssued: issue?.staffName?.toUpperCase() || '',
      notes: issue?.text?.toUpperCase() || '',
      items: issue?.items || [],
      issueDate: issue ? new Date(issue.issueDate) : new Date(),
      fromStoreId: issue?.storeId || '',
    },
    resolver: zodResolver(materialIssueFormSchema),
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(values: MaterialIssueFormValues) {
    const action = !issue ? createIssue : updateIssue.bind(null, issue.id);

    const res = await action(values);

    if (res.error) {
      toast.error(() => (
        <ToastContent
          title={`Error ${!issue ? 'creating' : 'updating'} issue`}
          message={res.message}
        />
      ));
      return;
    }
    form.reset();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 p-6 bg-card rounded-md shadow-sm"
      >
        <div className="grid md:grid-cols-3 gap-4 items-start">
          <FormField
            control={form.control}
            name="issueNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue No</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? dateFormat(field.value) : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobcardNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Card No</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="provide job card no" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="grid md:grid-cols-2 gap-4 items-start">
            <FormField
              control={form.control}
              name="staffIssued"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff Issued</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="provide staff issued" />
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
                  <FormLabel>Issuing Store</FormLabel>
                  <FormControl>
                    <MiniSelect
                      options={stores}
                      defaultValue={field.value}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select a store..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comments</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="eg For site work..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <IssueDetails form={form} isPending={isPending} products={products} />
        <FormActions isPending={isPending} resetFn={form.reset} />
      </form>
    </Form>
  );
}

function IssueDetails({
  form,
  isPending,
  products,
}: {
  form: UseFormReturn<MaterialIssueFormValues>;
  isPending: boolean;
  products: Array<Option>;
}) {
  const [items, fromStoreId, issueDate] = useWatch({
    control: form.control,
    name: ['items', 'fromStoreId', 'issueDate'],
  });
  const { fields, remove, append } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  //   async function handleProductCurrentBalance(value: string, i: number) {
  //     try {
  //       const response = await axios.get(
  //         `/api/products/${value}/current-balance?storeId=${
  //           fromStoreId || ''
  //         }&asOfDate=${issueDate || new Date()}`
  //       );
  //       const currentBalance = response.data.currentBalance;
  //       console.log('Current Balance:', currentBalance);
  //       form.setValue(`items.${i}.stockBalance`, currentBalance);
  //     } catch (error) {
  //       if (isAxiosError(error)) {
  //         const message = error.response?.data?.error || 'Unknown error';
  //         toast.error(message);
  //       } else {
  //         console.error(error);
  //         toast.error('Unknown error');
  //       }
  //     }
  //   }

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
              {/* <th
                className="text-left py-2 px-2 font-medium"
                style={{ width: '128px' }}
              >
                Current Stock
              </th> */}
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
                              //   handleProductCurrentBalance(value, index);
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
                {/* <td className="py-2 px-2" style={{ width: '128px' }}>
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
                </td> */}
                <td className="py-2 px-2" style={{ width: '128px' }}>
                  <FormField
                    control={form.control}
                    name={`items.${index}.issuedQty`}
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
            if (!fromStoreId || !issueDate) {
              return toast.error(
                'Please select From Store and Transfer Date first'
              );
            }
            append({
              id: createId(),
              itemId: '',
              issuedQty: 0,
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
