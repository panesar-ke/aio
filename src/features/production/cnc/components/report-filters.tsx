'use client';

import { DatePicker } from '@/components/custom/date-range';
import { MiniSelect } from '@/components/custom/mini-select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reportFilterSchema } from '@/features/production/cnc/utils/schema';
import type { ReportFilterSchema } from '@/features/production/cnc/utils/cnc.types';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useSearchParams } from '@/hooks/use-search-params';
import { dateFormat } from '@/lib/helpers/formatters';

export function ReportFilters() {
  const form = useForm<ReportFilterSchema>({
    defaultValues: {
      dateRange: {
        from: subDays(new Date(), 7),
        to: new Date(),
      },
      status: 'completed',
    },
    resolver: zodResolver(reportFilterSchema),
  });

  const { setSearchParams } = useSearchParams();

  return (
    <Form {...form}>
      <form
        className="grid md:grid-cols-3 gap-4"
        onSubmit={form.handleSubmit(data =>
          setSearchParams({
            status: data.status,
            from: dateFormat(data.dateRange.from),
            to: dateFormat(data.dateRange.to),
          })
        )}
      >
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Range</FormLabel>
              <DatePicker
                initialDateRange={field.value}
                onDateChange={field.onChange}
              />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <MiniSelect
                options={[
                  { label: 'Completed', value: 'completed' },
                  { label: 'In Progress', value: 'in progress' },
                  { label: 'On Hold', value: 'on hold' },
                ]}
                defaultValue={field.value}
                onChange={field.onChange}
                value={field.value}
                className="bg-background"
              />
            </FormItem>
          )}
        />
        <div className="hidden md:block" />
        <div className="flex gap-2">
          <Button type="submit">Preview</Button>
        </div>
      </form>
    </Form>
  );
}
