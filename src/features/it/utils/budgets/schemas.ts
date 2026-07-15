import { z } from 'zod';

import { getFinancialYearMonths } from '@/lib/helpers/dates';
import { dateFormat } from '@/lib/helpers/formatters';

export const budgetMonthLineSchema = z.object({
  monthDate: z.string().date(),
  amount: z.number().min(0, 'Amount cannot be negative'),
});

export const budgetFormSchemaValues = z
  .object({
    id: z.string().optional(),
    financialYearStart: z.number().int(),
    subCategoryId: z.string().min(1, 'Sub-category is required'),
    months: z.array(budgetMonthLineSchema).length(12),
  })
  .superRefine((data, ctx) => {
    const expectedMonths = getFinancialYearMonths(data.financialYearStart).map(
      month => dateFormat(month.date),
    );

    data.months.forEach((month, index) => {
      if (month.monthDate !== expectedMonths[index]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Month values do not match the selected financial year.',
          path: ['months', index, 'monthDate'],
        });
      }
    });
  });

export const budgetFormClientSchema = z.object({
  id: z.string().optional(),
  financialYearStart: z.string().min(1, 'Financial year is required'),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Sub-category is required'),
  monthAmounts: z
    .array(z.number().min(0, 'Amount cannot be negative'))
    .length(12),
});

export const budgetsSearchParamsSchema = z.object({
  search: z.string().nullish(),
  financialYearStart: z.string().nullish(),
});

export const budgetImportRowSchema = z.object({
  subCategoryId: z.string().min(1, 'Sub-category is required'),
  months: z.array(z.number().min(0, 'Amount cannot be negative')).length(12),
});

export type BudgetMonthLineSchema = z.infer<typeof budgetMonthLineSchema>;
export type BudgetFormSchemaValues = z.infer<typeof budgetFormSchemaValues>;
export type BudgetFormClientSchema = z.infer<typeof budgetFormClientSchema>;
export type BudgetsSearchParamsSchema = z.infer<
  typeof budgetsSearchParamsSchema
>;
export type BudgetImportRowSchema = z.infer<typeof budgetImportRowSchema>;
