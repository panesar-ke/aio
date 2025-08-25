'use client';

import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import type z from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { projectFormSchema } from '@/features/procurement/utils/schemas';
import { Input } from '@/components/ui/input';
import { FormActions } from '@/components/custom/form-actions';
import { createProject } from '@/features/procurement/services/vendors/actions';
import { ToastContent } from '@/components/custom/toast';
import { useModal } from '@/features/integrations/modal-provider';

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function ProjectForm() {
  const queryClient = useQueryClient();
  const { setClose } = useModal();
  const form = useForm<ProjectFormValues>({
    defaultValues: {
      projectName: '',
      active: true,
    },
    resolver: zodResolver(projectFormSchema),
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(values: ProjectFormValues) {
    const res = await createProject(values);
    if (res?.error) {
      return toast(() => (
        <ToastContent
          title="Error processing this request"
          message={res.message}
          state="error"
        />
      ));
    }
    queryClient.invalidateQueries({
      queryKey: ['projects'],
    });
    setClose();
  }

  return (
    <div className="space-y-6 ">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem className="col-span-6">
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter project name"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormActions
            resetFn={() => {
              form.reset();
              setClose();
            }}
            isPending={isPending}
          />
        </form>
      </Form>
    </div>
  );
}
