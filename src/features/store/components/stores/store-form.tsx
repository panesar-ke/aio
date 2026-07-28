'use client';

import type { Route } from 'next';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import type {
  Store,
  StoreFormValues,
} from '@/features/store/utils/store.types';

import { FormActions } from '@/components/custom/form-actions';
import { ToastContent } from '@/components/custom/toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  createStore,
  updateStore,
} from '@/features/store/services/stores/actions';
import { storeFormSchema } from '@/features/store/utils/schema';

export function StoreForm({ store }: { store?: Store }) {
  const router = useRouter();
  const form = useForm<StoreFormValues>({
    defaultValues: store ?? {
      description: '',
      storeName: '',
    },
    resolver: zodResolver(storeFormSchema),
  });

  const isPending = form.formState.isSubmitting;
  async function onSubmit(values: StoreFormValues) {
    const action = store ? updateStore.bind(null, store.id) : createStore;
    const res = await action(values);
    if (res.error) {
      toast.error(() => (
        <ToastContent title="Error creating store" message={res.message} />
      ));
      return;
    }
    form.reset();
    if ('redirectTo' in res && res.redirectTo) {
      router.push(res.redirectTo as Route);
    }
  }

  return (
    <div className="rounded-md bg-card p-6 max-w-xl mx-auto shadow-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="storeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isPending}
                    placeholder="Enter store name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={isPending}
                    placeholder="Enter store description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormActions resetFn={form.reset} isPending={isPending} />
        </form>
      </Form>
    </div>
  );
}
