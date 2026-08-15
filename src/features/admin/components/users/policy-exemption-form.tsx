'use client';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

import type { PolicyExemptionFormValues } from '@/features/admin/utils/admin.types';

import { notify } from '@/components/custom/toast';
import { grantPolicyExemption } from '@/features/admin/services/action';
import { policyExemptionFormSchema } from '@/features/admin/utils/schema';
import { useAppForm } from '@/lib/form';

export function PolicyExemptionForm() {
  const { userId } = useParams<{ userId: string }>();

  const mutation = useMutation({
    mutationFn: async (data: PolicyExemptionFormValues) => {
      return await grantPolicyExemption(data.userId, new Date(data.until));
    },
  });

  const form = useAppForm({
    defaultValues: {
      userId,
      until: '',
    } as PolicyExemptionFormValues,
    validators: {
      onSubmit: policyExemptionFormSchema,
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value, {
        onSuccess: () => {
          notify.success(
            'Exemption granted',
            'The user will not be asked to change their password until then.',
          );
          form.reset();
        },
        onError: () => {
          notify.error(
            'Error granting exemption',
            'An error occured while granting the exemption.',
          );
        },
      });
    },
  });

  return (
    <div className='space-y-6 bg-background p-4'>
      <form
        className='space-y-4'
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppField name='until'>
          {(field) => (
            <field.Input
              type='date'
              label='Exempt until'
              helperText='The exemption applies from the next time the user signs in.'
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton
            buttonText='Grant Exemption'
            withReset={false}
            orientation='horizontal'
            isLoading={mutation.isPending}
          />
        </form.AppForm>
      </form>
    </div>
  );
}
