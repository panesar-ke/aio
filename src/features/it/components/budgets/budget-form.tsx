'use client';

import { useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { SaveIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { upsertBudget } from '@/features/it/services/budgets/actions';
import { budgetFormClientSchema } from '@/features/it/utils/budgets/schemas';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';
import { getFinancialYearMonths } from '@/lib/helpers/dates';
import { dateFormat, numberFormat } from '@/lib/helpers/formatters';
import { type Option } from '@/types/index.types';

type BudgetFormValues = {
  id?: string;
  financialYearStart: string;
  categoryId: string;
  subCategoryId: string;
  monthAmounts: Array<number>;
};

type BudgetFormProps = {
  categories: Array<{ id: string; name: string }>;
  subCategories: Array<{ id: string; name: string; categoryId: string }>;
  financialYearOptions: Array<Option>;
  initialValues?: BudgetFormValues;
};

export function BudgetForm({
  categories,
  subCategories,
  financialYearOptions,
  initialValues,
}: BudgetFormProps) {
  const isEdit = Boolean(initialValues?.id);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { handleSubmit, AppField, AppForm, SubmitButton, store } = useAppForm({
    defaultValues:
      initialValues ??
      ({
        financialYearStart: financialYearOptions[0]?.value ?? '',
        categoryId: '',
        subCategoryId: '',
        monthAmounts: Array.from({ length: 12 }, () => 0),
      } as BudgetFormValues),
    validators: {
      onSubmit: budgetFormClientSchema,
    },
    onSubmit: async ({ value }) => {
      const financialYearStart = Number(value.financialYearStart);
      const months = getFinancialYearMonths(financialYearStart).map(
        (month, index) => ({
          monthDate: dateFormat(month.date),
          amount: value.monthAmounts[index] ?? 0,
        }),
      );

      await handleSubmitFeedback({
        action: () =>
          upsertBudget({
            id: value.id,
            financialYearStart,
            subCategoryId: value.subCategoryId,
            months,
          }),
        errorTitle: `Error ${isEdit ? 'updating' : 'creating'} budget`,
        successTitle: `✅ ${isEdit ? 'Updated' : 'Created'}`,
        fallbackMessage: `Failed to ${isEdit ? 'update' : 'create'} budget. Please try again.`,
        onSuccess: () => {
          router.push('/it/expenses-budgeting/budgets');
          queryClient.invalidateQueries({ queryKey: ['it-budgets'] });
        },
      });
    },
  });

  const [categoryId, financialYearStart, monthAmounts] = useStore(
    store,
    state => [
      state.values.categoryId,
      state.values.financialYearStart,
      state.values.monthAmounts,
    ],
  );

  const filteredSubCategories = subCategories.filter(
    subCategory => subCategory.categoryId === categoryId,
  );
  const months = getFinancialYearMonths(Number(financialYearStart));
  const total = monthAmounts.reduce((sum, amount) => sum + (amount || 0), 0);

  return (
    <Card className="shadow-none">
      <CardHeader className="border-b">
        <CardTitle>{isEdit ? 'Edit Budget' : 'New Budget'}</CardTitle>
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
            <FieldLegend>Budget Identity</FieldLegend>
            <FieldGroup className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AppField name="financialYearStart">
                {field => (
                  <field.Select
                    required
                    disabled={isEdit}
                    label="Financial Year"
                    placeholder="Select Financial Year"
                  >
                    {financialYearOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </AppField>
              <AppField name="categoryId">
                {field => (
                  <field.Select
                    required
                    disabled={isEdit}
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
                    disabled={isEdit}
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
            </FieldGroup>
          </FieldSet>
          <Separator />
          <FieldSet>
            <FieldLegend>Monthly Amounts</FieldLegend>
            <FieldGroup className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {months.map((month, index) => (
                <AppField key={month.label} name={`monthAmounts[${index}]`}>
                  {field => (
                    <field.Input
                      type="number"
                      min={0}
                      step="0.01"
                      label={month.label}
                      placeholder="0.00"
                    />
                  )}
                </AppField>
              ))}
            </FieldGroup>
            <div className="flex justify-end pt-2 text-sm font-medium">
              Total: {numberFormat(total)}
            </div>
          </FieldSet>
          <AppForm>
            <SubmitButton
              icon={<SaveIcon />}
              withReset
              buttonText={isEdit ? 'Update Budget' : 'Create Budget'}
            />
          </AppForm>
        </form>
      </CardContent>
    </Card>
  );
}
