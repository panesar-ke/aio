'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileTextIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Option } from '@/types/index.types';
import type { OrderRegisterFormValues } from '@/features/procurement/utils/procurement.types';
import { Input } from '@/components/ui/input';
import { SearchSelect } from '@/components/custom/search-select';
import { MiniSelect } from '@/components/custom/mini-select';
import { Button } from '@/components/ui/button';
import { dateFormat } from '@/lib/helpers/formatters';
import { orderRegisterSchema } from '@/features/procurement/utils/schemas';
import { useSearchParams as useParams } from '@/hooks/use-search-params';

type Props = {
  vendors: Array<Option>;
};

export function OrderRegisterParamsForm({ vendors }: Props) {
  const searchParams = useSearchParams();
  const { setSearchParams } = useParams();
  const form = useForm<OrderRegisterFormValues>({
    defaultValues: {
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
      reportType:
        (searchParams.get(
          'reportType'
        ) as OrderRegisterFormValues['reportType']) || 'summary',
      vendorId: searchParams.get('vendorId') || 'all',
    },
    mode: 'onChange',
    resolver: zodResolver(orderRegisterSchema),
  });
  return (
    <Form {...form}>
      <form
        className="space-y-4 bg-card p-4 rounded-lg shadow-sm"
        onSubmit={form.handleSubmit(data => {
          setSearchParams({
            from: data.from,
            to: data.to,
            reportType: data.reportType,
            vendorId: data.vendorId,
          });
        })}
      >
        <div className="grid md:grid-cols-12 gap-4 items-start">
          <FormField
            control={form.control}
            name="from"
            render={({ field }) => (
              <FormItem className="col-span-full md:col-span-3">
                <FormLabel>From</FormLabel>
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
            name="to"
            render={({ field }) => (
              <FormItem className="col-span-full md:col-span-3">
                <FormLabel>To</FormLabel>
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
            name="vendorId"
            render={({ field }) => (
              <FormItem className="col-span-full md:col-span-4">
                <FormLabel>Vendor</FormLabel>
                <FormControl>
                  <SearchSelect
                    options={[
                      { value: 'all', label: 'All Vendors' },
                      ...vendors,
                    ]}
                    emptyText="No vendors found"
                    searchText="Search vendors..."
                    onChange={field.onChange}
                    value={field.value}
                    placeholder="Select vendor..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reportType"
            render={({ field }) => (
              <FormItem className="col-span-full md:col-span-2">
                <FormLabel>Report Type</FormLabel>
                <FormControl>
                  <MiniSelect
                    options={[
                      { value: 'summary', label: 'Summary' },
                      { value: 'items', label: 'By Items' },
                    ]}
                    defaultValue={field.value}
                    onChange={field.onChange}
                    value={field.value}
                    placeholder="Select report type..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" size={'lg'}>
          <FileTextIcon />
          Generate Report
        </Button>
      </form>
    </Form>
  );
}
