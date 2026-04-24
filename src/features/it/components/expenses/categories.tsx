'use client';

import { useAppForm } from '@/lib/form';
import { expenseCategorySchema } from '@/features/it/utils/expenses/schemas';
import type { ExpenseCategorySchema } from '@/features/it/utils/expenses/schemas';
import { createExpenseCategory } from '@/features/it/services/expenses/actions';
import { useQueryClient } from '@tanstack/react-query';
import { useModal } from '@/features/integrations/modal-provider';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';

export function CategoriesForm() {
  const queryClient = useQueryClient();
  const { setClose } = useModal();
  const { handleSubmit, AppField, AppForm, SubmitButton } = useAppForm({
    defaultValues: {
      name: '',
      description: null,
    } as ExpenseCategorySchema,
    validators: {
      onSubmit: expenseCategorySchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => createExpenseCategory(value),
        errorTitle: 'Error creating expense category',
        successTitle: '✅ Success',
        fallbackMessage: 'Failed to create expense category. Please try again.',
        onSuccess: () => {
          setClose();
          queryClient.invalidateQueries({ queryKey: ['it-categories'] });
        },
      });
    },
  });
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
      }}
      className="space-y-6"
    >
      <AppField name="name">
        {field => (
          <field.Input
            required
            label="Category Name"
            placeholder="e.g. Hardware"
          />
        )}
      </AppField>
      <AppField name="description">
        {field => (
          <field.Textarea
            label="Description"
            placeholder="e.g. IT hardware expenses"
          />
        )}
      </AppField>
      <AppForm>
        <SubmitButton buttonText="Submit" withReset className="w-full" />
      </AppForm>
    </form>
  );
}
