'use client';

import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import type {
  Vendor,
  VendorFormValues,
} from '@/features/procurement/utils/procurement.types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { vendorSchema } from '@/features/procurement/utils/schemas';
import { Input } from '@/components/ui/input';
import { FormActions } from '@/components/custom/form-actions';
import {
  createVendor,
  updateVendor,
} from '@/features/procurement/services/vendors/actions';
import { ToastContent } from '@/components/custom/toast';

interface VendorFormProps {
  vendor?: Vendor;
}

export function VendorForm({ vendor }: VendorFormProps) {
  const form = useForm<VendorFormValues>({
    defaultValues: {
      vendorName: vendor?.vendorName.toUpperCase() || '',
      contact: vendor?.contact || '',
      email: vendor?.email || '',
      kraPin: vendor?.kraPin?.toUpperCase() || '',
      active: Boolean(vendor?.active) || true,
      contactPerson: vendor?.contactPerson?.toUpperCase() || '',
      address: '',
    },
    resolver: zodResolver(vendorSchema),
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(values: VendorFormValues) {
    const action = vendor ? updateVendor.bind(null, vendor.id) : createVendor;
    const res = await action(values);
    if (res?.error) {
      return toast(() => (
        <ToastContent
          title="Error processing this request"
          message={res.message}
          state="error"
        />
      ));
    }
  }

  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
        >
          <FormField
            control={form.control}
            name="vendorName"
            render={({ field }) => (
              <FormItem className="col-span-6">
                <FormLabel>Vendor Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter vendor name"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem className="col-span-6">
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter contact person"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Optional... Enter address"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem className="col-span-4">
                <FormLabel>Contact</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter contact"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="col-span-4">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    placeholder="Optional... Enter email"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kraPin"
            render={({ field }) => (
              <FormItem className="col-span-4">
                <FormLabel>Tax PIN</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Optional... Enter Tax PIN"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormActions
            className="col-span-full"
            resetFn={form.reset}
            isPending={isPending}
          />
        </form>
      </Form>
    </div>
  );
}
