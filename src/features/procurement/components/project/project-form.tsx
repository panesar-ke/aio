'use client';

import type z from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { FormActions } from '@/components/custom/form-actions';
import { notify } from '@/components/custom/toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useModal } from '@/features/integrations/modal-provider';
import { createProject } from '@/features/procurement/services/vendors/actions';
import { projectFormSchema } from '@/features/procurement/utils/schemas';

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
      return notify.error('Error processing this request', res.message);
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
