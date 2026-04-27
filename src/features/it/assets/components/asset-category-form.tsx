'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useModal } from '@/features/integrations/modal-provider';
import { createAssetCategory } from '@/features/it/assets/services/actions';
import {
  type AssetCategorySchema,
  assetCategorySchema,
} from '@/features/it/assets/utils/schemas';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';

export function AssetCategoryForm() {
  const queryClient = useQueryClient();
  const { setClose } = useModal();
  const { handleSubmit, AppField, AppForm, SubmitButton } = useAppForm({
    defaultValues: {
      name: '',
      description: null,
    } as AssetCategorySchema,
    validators: {
      onSubmit: assetCategorySchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => createAssetCategory(value),
        errorTitle: 'Error creating asset category',
        successTitle: '✅ Success',
        fallbackMessage: 'Failed to create asset category. Please try again.',
        onSuccess: () => {
          setClose();
          queryClient.invalidateQueries({ queryKey: ['it-asset-categories'] });
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
            placeholder="e.g. Laptops"
          />
        )}
      </AppField>
      <AppField name="description">
        {field => (
          <field.Textarea
            label="Description"
            placeholder="e.g. Portable work devices"
          />
        )}
      </AppField>
      <AppForm>
        <SubmitButton buttonText="Submit" withReset className="w-full" />
      </AppForm>
    </form>
  );
}
