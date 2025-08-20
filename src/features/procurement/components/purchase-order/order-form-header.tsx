import { useWatch } from 'react-hook-form';
import type { OrderForm } from '@/features/procurement/utils/procurement.types';
import type { Option } from '@/types/index.types';
import { MiniSelect } from '@/components/custom/mini-select';
import { SearchSelect } from '@/components/custom/search-select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useProcurementServices } from '@/features/procurement/hooks/use-procurement-services';

interface OrderFormHeaderProps extends OrderForm {
  vendors: Array<Option>;
}

export function OrderFormHeader({ form, vendors }: OrderFormHeaderProps) {
  const [vatType] = useWatch({ control: form.control, name: ['vatType'] });
  const { vendors: queryVendors } = useProcurementServices();
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <FormField
          control={form.control}
          name="documentNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order No</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="documentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={
                    field.value instanceof Date
                      ? field.value.toISOString().split('T')[0]
                      : field.value
                  }
                  onChange={e => field.onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor</FormLabel>
              <FormControl>
                <SearchSelect
                  onChange={field.onChange}
                  value={field.value}
                  emptyText="No vendors found"
                  placeholder="Select vendor"
                  options={queryVendors || vendors}
                  searchText="Search vendors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        <FormField
          control={form.control}
          name="invoiceNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice No</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter invoice number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="invoiceDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={
                    field.value instanceof Date
                      ? field.value.toISOString().split('T')[0]
                      : field.value
                  }
                  onChange={e => field.onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vatType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vat Type</FormLabel>
              <FormControl>
                <MiniSelect
                  defaultValue={field.value}
                  placeholder="Select VAT Type"
                  onChange={field.onChange}
                  options={[
                    { value: 'NONE', label: 'None' },
                    { value: 'INCLUSIVE', label: 'Inclusive' },
                    { value: 'EXCLUSIVE', label: 'Exclusive' },
                  ]}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vat</FormLabel>
              <FormControl>
                <MiniSelect
                  defaultValue={field.value}
                  placeholder="Select VAT"
                  onChange={field.onChange}
                  options={[{ value: '16', label: '16%' }]}
                  disabled={vatType === 'NONE'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
