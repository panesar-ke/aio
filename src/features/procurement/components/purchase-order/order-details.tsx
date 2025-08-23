import { useFieldArray, useWatch } from 'react-hook-form';
import { Trash2Icon } from 'lucide-react';
import type { OrderForm } from '@/features/procurement/utils/procurement.types';
import type { IsPending, Option } from '@/types/index.types';
import { MiniSelect } from '@/components/custom/mini-select';
import { SearchSelect } from '@/components/custom/search-select';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { calculateDiscount } from '@/features/procurement/utils/calculators';
import { Button } from '@/components/ui/button';

interface OrderDetailsProps extends OrderForm, IsPending {
  services: Array<Option>;
  products: Array<Option>;
  projects: Array<Option>;
}
export function OrderDetails({
  form,
  services,
  products,
  projects,
}: OrderDetailsProps) {
  const details = useWatch({ control: form.control, name: 'details' });
  const { remove } = useFieldArray({
    control: form.control,
    name: 'details',
  });

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
                className="text-left py-2 px-2 font-medium "
                style={{ width: '384px' }}
              >
                Project
              </th>
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
                Qty
              </th>
              <th
                className="text-left py-2 px-2 font-medium "
                style={{ width: '156px' }}
              >
                Rate
              </th>
              <th
                className="text-left py-2 px-2 font-medium "
                style={{ width: '156px' }}
              >
                Gross
              </th>
              <th
                className="text-left py-2 px-2 font-medium "
                style={{ width: '156px' }}
              >
                Disc Type
              </th>
              <th
                className="text-left py-2 px-2 font-medium "
                style={{ width: '128px' }}
              >
                Discount
              </th>
              <th
                className="text-left py-2 px-2 font-medium "
                style={{ width: '128px' }}
              >
                Discounted
              </th>
              <th
                className="text-left py-2 px-2 font-medium "
                style={{ width: '128px' }}
              >
                Net
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
            {details.map((f, index) => (
              <OrderDetailRow
                key={f.id}
                index={index}
                form={form}
                projects={projects}
                products={products}
                services={services}
                isPending={form.formState.isSubmitting}
                onRemove={() => remove(index)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {details.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No order details added yet. Use &quot;Pending Requests&quot; to add
          items.
        </div>
      )}
    </div>
  );
}

interface OrderDetailRowProps extends OrderForm, IsPending {
  index: number;
  projects: Array<Option>;
  products: Array<Option>;
  services: Array<Option>;
  onRemove: () => void;
}

function OrderDetailRow({
  index,
  form,
  projects,
  products,
  services,
  isPending,
  onRemove,
}: OrderDetailRowProps) {
  const watchedType = useWatch({
    control: form.control,
    name: `details.${index}.type`,
  });
  const watchedQty = useWatch({
    control: form.control,
    name: `details.${index}.qty`,
  });
  const watchedRate = useWatch({
    control: form.control,
    name: `details.${index}.rate`,
  });
  const gross = (watchedQty || 0) * (watchedRate || 0);
  const discountType = useWatch({
    control: form.control,
    name: `details.${index}.discountType`,
  }) as 'NONE' | 'PERCENTAGE' | 'AMOUNT';
  const watchedDiscount =
    useWatch({
      control: form.control,
      name: `details.${index}.discount`,
    }) || 0;
  const discountedAmount = calculateDiscount(
    discountType,
    watchedDiscount,
    gross
  );

  const netAmount = gross - discountedAmount; // + (watchedVat || 0)
  return (
    <tr>
      <td className="py-2 px-2" style={{ width: '384px' }}>
        <FormField
          control={form.control}
          name={`details.${index}.projectId`}
          render={({ field }) => {
            return (
              <FormItem className="w-full">
                <FormControl>
                  <SearchSelect
                    onChange={field.onChange}
                    value={field.value}
                    emptyText="Project not found"
                    placeholder="Select project"
                    options={projects}
                    searchText="Search project"
                    isPending={isPending}
                  />
                </FormControl>
              </FormItem>
            );
          }}
        />
      </td>
      <td className="py-2 px-2" style={{ width: '480px' }}>
        <FormField
          control={form.control}
          name={`details.${index}.itemOrServiceId`}
          render={({ field }) => {
            return (
              <FormItem className="w-full">
                <SearchSelect
                  onChange={field.onChange}
                  value={field.value}
                  emptyText="Product not found"
                  placeholder="Select product"
                  isPending={isPending}
                  options={watchedType === 'item' ? products : services}
                  searchText="Search product"
                />

                {/* <FormMessage /> */}
              </FormItem>
            );
          }}
        />
      </td>
      <td className="py-2 px-2" style={{ width: '128px' }}>
        <FormField
          control={form.control}
          name={`details.${index}.qty`}
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
      </td>
      <td className="py-2 px-2" style={{ width: '156px' }}>
        <FormField
          control={form.control}
          name={`details.${index}.rate`}
          render={({ field }) => {
            return (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Rate"
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
      <td className="py-2 px-2" style={{ width: '156px' }}>
        <Input value={gross} autoFocus={false} className="w-full" disabled />
      </td>
      <td className="py-2 px-2" style={{ width: '156px' }}>
        <FormField
          control={form.control}
          name={`details.${index}.discountType`}
          render={({ field }) => {
            return (
              <FormItem className="w-full">
                <FormControl>
                  <MiniSelect
                    options={[
                      { value: 'NONE', label: 'None' },
                      { value: 'PERCENTAGE', label: 'Percentage' },
                      { value: 'AMOUNT', label: 'Amount' },
                    ]}
                    disabled={isPending}
                    {...field}
                    onChange={(value: string) => {
                      field.onChange(value as 'NONE' | 'PERCENTAGE' | 'AMOUNT');
                      if (value === 'NONE') {
                        form.setValue(`details.${index}.discount`, 0);
                      }
                    }}
                  />
                </FormControl>
                {/* <FormMessage /> */}
              </FormItem>
            );
          }}
        />
      </td>
      <td className="py-2 px-2" style={{ width: '128px' }}>
        <FormField
          control={form.control}
          name={`details.${index}.discount`}
          render={({ field }) => {
            return (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Discount"
                    {...field}
                    value={field.value || ''}
                    autoFocus={false}
                    className="w-full"
                    disabled={discountType === 'NONE'}
                  />
                </FormControl>
                {/* <FormMessage /> */}
              </FormItem>
            );
          }}
        />
      </td>
      <td className="py-2 px-2" style={{ width: '128px' }}>
        <Input
          value={discountedAmount}
          autoFocus={false}
          className="w-full"
          disabled
        />
      </td>
      <td className="py-2 px-2" style={{ width: '128px' }}>
        <Input
          value={netAmount}
          autoFocus={false}
          className="w-full"
          disabled
        />
      </td>
      <td className="py-2 px-2 text-center" style={{ width: '128px' }}>
        <Button
          variant="ghost"
          className="h-6 w-6 text-destructive"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          type="button"
          disabled={isPending}
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
