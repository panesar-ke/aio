'use client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
  Service,
  ServiceFormValues,
} from '@/features/procurement/utils/procurement.types';
import { serviceSchema } from '@/features/procurement/utils/schemas';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormActions } from '@/components/custom/form-actions';
import {
  createService,
  updateService,
} from '@/features/procurement/services/services/actions';
import { ToastContent } from '@/components/custom/toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useModal } from '@/features/integrations/modal-provider';

export function ServiceForm({
  service,
  fromModal,
}: {
  service?: Service;
  fromModal?: boolean;
}) {
  const queryClient = useQueryClient();
  const { setClose } = useModal();
  const router = useRouter();
  const form = useForm<ServiceFormValues>({
    defaultValues: {
      serviceFee: service?.serviceFee ?? 0,
      serviceName: service?.serviceName.toUpperCase() ?? '',
      active: service?.active ?? true,
    },
    resolver: zodResolver(serviceSchema),
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(values: ServiceFormValues) {
    const action = service
      ? updateService.bind(null, service.id)
      : createService;

    const res = await action(values);
    if (res.error) {
      return toast.error(() => (
        <ToastContent message={res.message} title="Something went wrong" />
      ));
    }
    queryClient.invalidateQueries({ queryKey: ['services'] });
    if (!fromModal && !service) {
      router.push('/procurement/services');
    }
    if (fromModal) {
      setClose();
    }
  }

  return (
    <div
      className={cn('', {
        'bg-card max-w-2xl mx-auto p-6 shadow-sm rounded-lg': !fromModal,
      })}
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="serviceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter service name"
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>
                  Search for existing services first to avoid duplicates in the
                  services list.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder="Enter service fee"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {service && (
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="col-span-full flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Active</FormLabel>
                  <FormDescription>
                    {!field.value
                      ? 'Check if the service is active.'
                      : 'Uncheck if the service is inactive.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormActions
            className="col-span-full"
            resetFn={() => {
              form.reset();
              if (fromModal) {
                setClose();
              }
            }}
            isPending={isPending}
          />
        </form>
      </Form>
    </div>
  );
}
