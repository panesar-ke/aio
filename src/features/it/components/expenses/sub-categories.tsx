'use client';

import { useAppForm } from '@/lib/form';
import { expenseSubCategorySchema } from '@/features/it/utils/expenses/schemas';
import type { ExpenseSubCategorySchema } from '@/features/it/utils/expenses/schemas';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useModal } from '@/features/integrations/modal-provider';
import type { Option } from '@/types/index.types';
import { SelectItem } from '@/components/ui/select';
import { ErrorNotification } from '@/components/custom/error-components';
import { createExpenseSubCategory } from '@/features/it/services/expenses/actions';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';

async function fetchCategories(): Promise<Array<Option>> {
  const res = await fetch('/api/it/categories');
  if (!res.ok) {
    throw new Error('Failed to fetch categories');
  }
  const data = await res.json();
  return data;
}

export function SubCategoriesForm() {
  const queryClient = useQueryClient();
  const { setClose } = useModal();
  const { handleSubmit, AppField, AppForm, SubmitButton } = useAppForm({
    defaultValues: {
      name: '',
      categoryId: '',
    } as ExpenseSubCategorySchema,
    validators: {
      onSubmit: expenseSubCategorySchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => createExpenseSubCategory(value),
        errorTitle: 'Error creating expense sub-category',
        successTitle: '✅ Success',
        fallbackMessage:
          'Failed to create expense sub-category. Please try again.',
        onSuccess: () => {
          setClose();
          queryClient.invalidateQueries({ queryKey: ['it-sub-categories'] });
        },
      });
    },
  });

  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['it-categories'],
    queryFn: fetchCategories,
  });

  if (isError) {
    return (
      <ErrorNotification message="Couldn't fetch Categories at this time" />
    );
  }

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
            label="Sub-category Name"
            placeholder="e.g. Hardware"
          />
        )}
      </AppField>
      <AppField name="categoryId">
        {field => (
          <field.Select
            required
            label="Category"
            placeholder={
              isLoading ? 'Loading categories...' : 'Select a category'
            }
          >
            {(categories ?? []).map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </field.Select>
        )}
      </AppField>
      <AppForm>
        <SubmitButton buttonText="Submit" withReset className="w-full" />
      </AppForm>
    </form>
  );
}
