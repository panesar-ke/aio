'use client';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileTextIcon } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MiniSelect } from '@/components/custom/mini-select';
import { Button } from '@/components/ui/button';
import type { TopVendorFormValues } from '@/features/procurement/utils/procurement.types';
import { useSearchParams as useParams } from '@/hooks/use-search-params';
import { topVendorsSchema } from '@/features/procurement/utils/schemas';
import { dateFormat } from '@/lib/helpers/formatters';

export function TopVendorForm() {
  const searchParams = useSearchParams();
  const { setSearchParams } = useParams();
  const form = useForm<TopVendorFormValues>({
    defaultValues: {
      criteria:
        (searchParams.get('criteria') as TopVendorFormValues['criteria']) ||
        'value',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
      top: searchParams.get('top') || '10',
    },
    resolver: zodResolver(topVendorsSchema),
  });
  return (
    <Form {...form}>
      <form
        className="space-y-4 bg-card p-4 rounded-lg shadow-sm"
        onSubmit={form.handleSubmit(data => {
          setSearchParams({
            from: data.from,
            to: data.to,
            top: data.top,
            criteria: data.criteria,
          });
        })}
      >
        <div className="grid md:grid-cols-12 gap-4 items-start">
          <FormField
            control={form.control}
            name="criteria"
            render={({ field }) => (
              <FormItem className="col-span-full md:col-span-3">
                <FormLabel>Criteria</FormLabel>
                <FormControl>
                  <MiniSelect
                    options={[
                      { value: 'discount', label: 'By Discount' },
                      { value: 'value', label: 'By Value' },
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
            name="top"
            render={({ field }) => (
              <FormItem className="col-span-full md:col-span-3">
                <FormLabel>Top</FormLabel>
                <FormControl>
                  <MiniSelect
                    options={[
                      { value: '5', label: 'Top 5' },
                      { value: '10', label: 'Top 10' },
                      { value: '20', label: 'Top 20' },
                      { value: '50', label: 'Top 50' },
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
