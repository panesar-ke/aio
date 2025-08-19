'use client';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2Icon } from 'lucide-react';
import type { Option } from '@/types/index.types';
import type { AutoOrderFormValues } from '@/features/procurement/utils/procurement.types';
import { generateRandomId } from '@/lib/utils';
import { autoOrdersSchema } from '@/features/procurement/utils/schemas';
import { FormActions } from '@/components/custom/form-actions';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { SearchSelect } from '@/components/custom/search-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAutoOrder } from '@/features/procurement/services/auto-order/action';
import { ToastContent } from '@/components/custom/toast';

interface AutoOrdersFormProps {
  products: Array<Option>;
  vendors: Array<Option>;
  autoOrdersItems?: AutoOrderFormValues['items'];
}

const INITIAL_VALUES: AutoOrderFormValues['items'][number] = {
  id: generateRandomId(`auto-order-item`),
  productId: '',
  reorderLevel: 10,
  reorderQty: 0,
  vendorId: '',
};

export function AutoOrdersForm({
  products,
  vendors,
  autoOrdersItems,
}: AutoOrdersFormProps) {
  const form = useForm<AutoOrderFormValues>({
    defaultValues: {
      items: autoOrdersItems || [INITIAL_VALUES],
    },
    resolver: zodResolver(autoOrdersSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(values: AutoOrderFormValues) {
    const res = await createAutoOrder(values);
    if (res.error) {
      return toast.error(() => (
        <ToastContent
          message={res.message || 'Auto order created successfully'}
          title={res.error ? 'Something went wrong' : 'Success'}
        />
      ));
    }
  }

  return (
    <div className="p-6 bg-card rounded-lg shadow-sm">
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
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
                    Reorder Level
                  </th>
                  <th
                    className="text-left py-2 px-2 font-medium"
                    style={{ width: '480px' }}
                  >
                    Vendor
                  </th>

                  <th
                    className="text-left py-2 px-2 font-medium "
                    style={{ width: '384px' }}
                  >
                    Reorder Quantity
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
                        name={`items.${index}.productId`}
                        render={({ field }) => {
                          const handleProductChange = (value: string) => {
                            const currentItems = form.getValues('items');
                            const isProductAlreadySelected = currentItems.some(
                              (item, itemIndex) =>
                                itemIndex !== index && item.productId === value
                            );

                            if (isProductAlreadySelected) {
                              form.setError(`items.${index}.productId`, {
                                type: 'manual',
                                message:
                                  'This product is already selected in another row',
                              });
                              return;
                            }

                            form.clearErrors(`items.${index}.productId`);
                            field.onChange(value);
                          };

                          return (
                            <FormItem className="w-full">
                              <FormControl>
                                <SearchSelect
                                  onChange={handleProductChange}
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
                          );
                        }}
                      />
                    </td>
                    <td className="py-2 px-2" style={{ width: '128px' }}>
                      <FormField
                        control={form.control}
                        name={`items.${index}.reorderLevel`}
                        render={({ field }) => {
                          return (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Reorder level qty"
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
                    </td>
                    <td className="py-2 px-2" style={{ width: '480px' }}>
                      <FormField
                        control={form.control}
                        name={`items.${index}.vendorId`}
                        render={({ field }) => {
                          return (
                            <FormItem className="w-full">
                              <SearchSelect
                                onChange={field.onChange}
                                value={field.value}
                                emptyText="Vendor not found"
                                placeholder="Select vendor"
                                isPending={isPending}
                                options={vendors}
                                searchText="Search vendor"
                              />

                              {/* <FormMessage /> */}
                            </FormItem>
                          );
                        }}
                      />
                    </td>

                    <td className="py-2 px-2" style={{ width: '384px' }}>
                      <FormField
                        control={form.control}
                        name={`items.${index}.reorderQty`}
                        render={({ field }) => {
                          return (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Qty to order"
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
              onClick={() => append(INITIAL_VALUES)}
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
          <FormActions isPending={isPending} resetFn={form.reset} />
        </form>
      </Form>
    </div>
  );
}
