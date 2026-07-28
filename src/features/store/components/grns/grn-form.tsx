'use client';

import type { Route } from 'next';
import type { UseFormReturn } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import type { GrnFormValues } from '@/features/store/utils/store.types';
import type { Option } from '@/types/index.types';

import { FormActions } from '@/components/custom/form-actions';
import { MiniSelect } from '@/components/custom/mini-select';
import { SearchSelect } from '@/components/custom/search-select';
// import { MiniSelect } from '@/components/custom/mini-select';
import { ToastContent } from '@/components/custom/toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createGrn } from '@/features/store/services/grns/actions';
import { grnFormSchema } from '@/features/store/utils/schema';
import { dateFormat } from '@/lib/helpers/formatters';
import { apiErrorHandler } from '@/lib/utils';

type Props = {
  //   vendors: Array<Option>;
  stores: Array<Option>;
  pendingOrders: Array<Option>;
  grnNo: number;
  defaultReceiptDate?: string;
};

type OrderDetails = {
  vendorId: string;
  vendorName: string;
  billNo: string | null;
  ordersDetails: Array<{
    id: string;
    product: string;
    itemId: string | null;
    qty: string;
    rate: string;
  }>;
};

export function GrnForm({
  pendingOrders,
  grnNo,
  stores,
  defaultReceiptDate,
}: Props) {
  const router = useRouter();
  const form = useForm<GrnFormValues>({
    defaultValues: {
      receiptDate: defaultReceiptDate
        ? new Date(defaultReceiptDate)
        : new Date(),
      orderId: '',
      invoiceNo: '',
      vendorName: '',
      vendorId: '',
      storeId: '',
      items: [],
    },
    resolver: zodResolver(grnFormSchema),
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(values: GrnFormValues) {
    const action = createGrn;
    const res = await action(values);
    if (res.error) {
      toast.error(() => (
        <ToastContent title="Error saving GRN" message={res.message} />
      ));
      return;
    }
    form.reset();
    if ('redirectTo' in res && res.redirectTo) {
      router.push(res.redirectTo as Route);
    }
  }

  async function handleOrderChange(orderId: string) {
    try {
      const {
        data: { data },
      } = await axios.get<{ data: OrderDetails }>(`/api/orders/${orderId}`);
      form.setValue('vendorId', data.vendorId);
      form.setValue('vendorName', data.vendorName);
      form.setValue('invoiceNo', data.billNo ?? '');
      form.setValue(
        'items',
        data.ordersDetails.map(i => ({
          id: i.id ?? '',
          productName: i.product ?? '',
          itemId: i.itemId ?? '',
          orderedQty: parseInt(i.qty, 10),
          qty: parseInt(i.qty, 10),
          rate: parseFloat(i.rate),
          remarks: '',
        }))
      );
    } catch (error) {
      toast.error(() => (
        <ToastContent
          title="Error fetching order details"
          message={apiErrorHandler(error)}
        />
      ));
    }
  }
  return (
    <Form {...form}>
      <form
        className="space-y-4 bg-card rounded-md shadow-sm p-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Grn #</Label>
              <Input value={grnNo} disabled />
            </div>
            <FormField
              control={form.control}
              name="receiptDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      value={field.value ? dateFormat(field.value) : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="orderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order No</FormLabel>
                <FormControl>
                  <SearchSelect
                    options={pendingOrders}
                    searchText="Search for order..."
                    emptyText="No orders found"
                    onChange={(value: string) => {
                      field.onChange(value);
                      if (!value) return;
                      handleOrderChange(value);
                    }}
                    value={field.value}
                    placeholder="Select for order..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vendorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor</FormLabel>
                <FormControl>
                  <Input {...field} disabled className="uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="invoiceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice No</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store</FormLabel>
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
        </div>
        <GrnDetails form={form} isPending={isPending} />
        <FormActions resetFn={form.reset} isPending={isPending} />
      </form>
    </Form>
  );
}

function GrnDetails({
  form,
  isPending,
}: {
  form: UseFormReturn<GrnFormValues>;
  isPending: boolean;
}) {
  const { fields, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  return (
    <div className="">
      <Table className="overflow-y-auto rounded-md">
        <TableHeader>
          <TableRow>
            <TableHead className="w-80 min-w-80">Item</TableHead>
            <TableHead className="w-24 min-w-24">Ordered Qty</TableHead>
            <TableHead className="w-24 min-w-24">Received Qty</TableHead>
            <TableHead className="w-24 min-w-24">Rate</TableHead>
            <TableHead className="w-40 min-w-48">Remarks</TableHead>
            <TableHead className="w-20 min-w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell className="w-80">
                {item.productName.toUpperCase()}
              </TableCell>
              <TableCell className="w-24">{item.orderedQty}</TableCell>
              <TableCell className="w-24">
                <FormField
                  control={form.control}
                  name={`items.${index}.qty`}
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
                        {/* <FormMessage /> */}
                      </FormItem>
                    );
                  }}
                />
              </TableCell>
              <TableCell className="w-24">{item.rate}</TableCell>
              <TableCell className="w-48">
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
                            value={field.value || ''}
                            autoFocus={false}
                            className="w-full"
                            disabled={isPending}
                          />
                        </FormControl>
                        {/* <FormMessage /> */}
                      </FormItem>
                    );
                  }}
                />
              </TableCell>
              <TableCell className="w-10">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={isPending}
                  onClick={() => {
                    remove(index);
                  }}
                >
                  <TrashIcon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
