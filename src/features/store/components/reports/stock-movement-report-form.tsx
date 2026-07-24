'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileTextIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';

import type { StockMovementReportFilterFormValues } from '@/features/store/utils/store.types';
import type { Option } from '@/types/index.types';

import { MiniSelect } from '@/components/custom/mini-select';
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
import { stockMovementReportFilterSchema } from '@/features/store/utils/schema';
import { useSearchParams } from '@/hooks/use-search-params';
import { dateFormat } from '@/lib/helpers/formatters';

type Props = {
  stores: Array<Option>;
  defaultValues: StockMovementReportFilterFormValues;
};

export function StockMovementReportForm({ stores, defaultValues }: Props) {
  const { setSearchParams } = useSearchParams();
  const form = useForm<StockMovementReportFilterFormValues>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(stockMovementReportFilterSchema),
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4 bg-card p-4 rounded-lg shadow-sm"
        onSubmit={form.handleSubmit(data => {
          setSearchParams({
            storeId: data.storeId,
            from: data.from,
            to: data.to,
          });
        })}
      >
        <div className="grid md:grid-cols-12 gap-4 items-start">
          <FormField
            control={form.control}
            name="storeId"
            render={({ field }) => (
              <FormItem className="col-span-full md:col-span-4">
                <FormLabel>Store</FormLabel>
                <FormControl>
                  <MiniSelect
                    options={stores}
                    {...field}
                    defaultValue={field.value}
                    placeholder="Select a store"
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
          <div className="col-span-full md:col-span-2 flex items-end h-full">
            <Button type="submit" size="lg" className="w-full">
              <FileTextIcon />
              Generate
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
