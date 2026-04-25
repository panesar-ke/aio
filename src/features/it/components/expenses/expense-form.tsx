'use client';

import { useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { SaveIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { upsertExpense } from '@/features/it/services/expenses/actions';
import {
  type ExpenseFormSchemaValues,
  expenseFormSchemaValues,
} from '@/features/it/utils/expenses/schemas';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';
import { type Option } from '@/types/index.types';

type ExpenseFormProps = {
  categories: Array<{ id: string; name: string }>;
  subCategories: Array<{ id: string; name: string; categoryId: string }>;
  // assets: Array<{id:string,name:string}>
  // licenses: Array<{id:string,name:string}>
  vendors: Array<Option>;
  initialValues?: ExpenseFormSchemaValues;
};

export function ExpenseForm({
  categories,
  vendors,
  subCategories,
  initialValues,
}: ExpenseFormProps) {
  const isEdit = Boolean(initialValues?.id);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { handleSubmit, AppField, AppForm, SubmitButton, store } = useAppForm({
    defaultValues:
      initialValues ??
      ({
        amount: 0,
        categoryId: '',
        subCategoryId: '',
        vendorId: '',
        expenseDate: new Date().toISOString().split('T')[0],
        title: '',
        referenceNo: '',
        description: undefined,
        assetId: undefined,
        licenseId: undefined,
      } as ExpenseFormSchemaValues),
    validators: {
      onSubmit: expenseFormSchemaValues,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => upsertExpense(value),
        errorTitle: `Error ${isEdit ? 'updating' : 'creating'} expense`,
        successTitle: `✅ ${isEdit ? 'Updated' : 'Created'}`,
        fallbackMessage: `Failed to ${isEdit ? 'update' : 'create'} expense. Please try again.`,
        onSuccess: () => {
          router.push('/it/expenses-budgeting/expenses');
          queryClient.invalidateQueries({ queryKey: ['it-expenses'] });
        },
      });
    },
  });

  const [categoryId] = useStore(store, state => [state.values.categoryId]);
  const filteredSubCategories = subCategories.filter(
    subCategory => subCategory.categoryId === categoryId,
  );

  return (
    <Card className="shadow-none">
      <CardHeader className="border-b">
        <CardTitle>{isEdit ? 'Edit Expense' : 'New Expense'}</CardTitle>
        <CardDescription>
          Fill in the details below to {isEdit ? 'update this ' : 'create an '}
          expense.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          <FieldSet>
            <FieldLegend>General Information</FieldLegend>
            <FieldGroup className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppField name="title">
                {field => (
                  <field.Input
                    fieldClassName="col-span-2"
                    required
                    placeholder="eg Annual Sophos Subscription"
                    label="Title"
                  />
                )}
              </AppField>
              <AppField name="referenceNo">
                {field => (
                  <field.Input
                    required
                    placeholder="eg Vendor Invoice #12345"
                    label="Reference No"
                  />
                )}
              </AppField>
              <AppField name="expenseDate">
                {field => (
                  <field.Input type="date" required label="Expense Date" />
                )}
              </AppField>
              <AppField name="vendorId">
                {field => (
                  <field.Select
                    required
                    label="Vendor"
                    placeholder="Select Vendor"
                  >
                    {vendors.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </AppField>
              <AppField name="amount">
                {field => (
                  <field.Input
                    type="number"
                    required
                    label="Amount"
                    placeholder="0.00"
                  />
                )}
              </AppField>
            </FieldGroup>
          </FieldSet>
          <Separator />
          <FieldSet>
            <FieldLegend>CATEGORIZATION</FieldLegend>
            <FieldGroup className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppField name="categoryId">
                {field => (
                  <field.Select
                    required
                    label="Category"
                    placeholder="Select Category"
                  >
                    {categories.map(({ id, name }) => (
                      <SelectItem key={id} value={id}>
                        {name.toUpperCase()}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </AppField>
              <AppField name="subCategoryId">
                {field => (
                  <field.Select
                    required
                    label="Sub Category"
                    placeholder="Select Sub Category"
                  >
                    {filteredSubCategories.map(({ id, name }) => (
                      <SelectItem key={id} value={id}>
                        {name.toUpperCase()}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </AppField>
              <AppField name="assetId">
                {field => (
                  <field.Select label="Asset" placeholder="Select Asset">
                    <SelectItem value="1">Asset 1</SelectItem>
                    <SelectItem value="2">Asset 2</SelectItem>
                  </field.Select>
                )}
              </AppField>
              <AppField name="licenseId">
                {field => (
                  <field.Select label="License" placeholder="Select License">
                    <SelectItem value="1">License 1</SelectItem>
                    <SelectItem value="2">License 2</SelectItem>
                  </field.Select>
                )}
              </AppField>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend>ADDITIONAL INFORMATION</FieldLegend>
            <FieldGroup>
              <AppField name="description">
                {field => (
                  <field.Textarea
                    label="Description"
                    placeholder="Enter additional information"
                  />
                )}
              </AppField>
            </FieldGroup>
          </FieldSet>
          <AppForm>
            <SubmitButton
              icon={<SaveIcon />}
              withReset
              buttonText={isEdit ? 'Update Expense' : 'Create Expense'}
            />
          </AppForm>
        </form>
      </CardContent>
    </Card>
  );
}
