'use client';

import { useSelector } from '@tanstack/react-store';
import { SaveIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { Store } from '@/features/store/utils/store.types';

import { FormSectionHeader } from '@/components/custom/form-header';
import { upsertStore } from '@/features/store/services/stores/actions';
import { storeFormSchema } from '@/features/store/utils/schema';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';

export function StoreForm({ store }: { store?: Store }) {
  const router = useRouter();
  const isEdit = !!store;
  const form = useAppForm({
    defaultValues: {
      id: store?.id ?? null,
      storeName: store?.storeName ?? '',
      description: store?.description ?? '',
    },
    validators: {
      onSubmit: storeFormSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => upsertStore(value),
        errorTitle: `Error ${isEdit ? 'updating' : 'creating'} store`,
        successTitle: `✅ ${isEdit ? 'Updated' : 'Created'}`,
        fallbackMessage: `Failed to ${isEdit ? 'update' : 'create'} store. Please try again.`,
        onSuccess: () => {
          form.reset();
          router.push('/store/stores');
        },
      });
    },
  });

  const isPending = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <div className='max-w-xl rounded-md border bg-card shadow-sm'>
      <FormSectionHeader
        title={`${store ? 'Edit' : 'Add'} Store`}
        description='Provide store details below'
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className='space-y-4  p-6 '
      >
        <form.AppField name='storeName'>
          {(field) => (
            <field.Input
              required
              label='Store Name'
              placeholder='Enter store name'
            />
          )}
        </form.AppField>
        <form.AppField name='description'>
          {(field) => (
            <field.Textarea
              required
              label='Store Description'
              placeholder='Enter store description'
              rows={10}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton
            buttonText={store ? 'Update Store' : 'Create Store'}
            isLoading={isPending}
            withReset
            icon={<SaveIcon />}
          />
        </form.AppForm>
      </form>
    </div>
  );
}
