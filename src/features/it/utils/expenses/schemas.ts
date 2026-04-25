import { z } from 'zod';

export const expenseCategorySchema = z.object({
  name: z.string().min(3, 'Category name must be at least 3 characters'),
  description: z.string().nullish(),
});

export const expenseSubCategorySchema = z.object({
  name: z.string().min(3, 'Sub-category name must be at least 3 characters'),
  categoryId: z.string().min(1, 'Category is required'),
});

export const expenseFormSchemaValues = z
  .object({
    id: z.string().optional(),
    expenseDate: z.string().date(),
    referenceNo: z.string().min(1, 'Reference number is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    categoryId: z.string().min(1, 'Category is required'),
    subCategoryId: z.string().min(1, 'Sub-category is required'),
    vendorId: z.string().min(1, 'Vendor is required'),
    assetId: z.string().nullish(),
    licenseId: z.string().nullish(),
    amount: z.number().min(1, 'Amount is required'),
  })
  .superRefine((data, ctx) => {
    if (data.expenseDate) {
      const expenseDate = new Date(data.expenseDate);
      const today = new Date();
      expenseDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (expenseDate > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expense date cannot be in the future',
          path: ['expenseDate'],
        });
      }
    }
  });

export const expensesSearchParamsSchema = z
  .object({
    search: z.string().nullish(),
    from: z.string().date().nullish(),
    to: z.string().date().nullish(),
  })
  .refine(
    data => {
      if (!data.from && !data.to) return true;
      const from = data.from ? new Date(data.from) : null;
      const to = data.to ? new Date(data.to) : null;

      if (!from || !to) return true;

      from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);

      return from <= to;
    },
    {
      message: 'From date must be before or the same as To date',
      path: ['from', 'to'],
    },
  );

export type ExpenseCategorySchema = z.infer<typeof expenseCategorySchema>;
export type ExpenseSubCategorySchema = z.infer<typeof expenseSubCategorySchema>;
export type ExpenseFormSchemaValues = z.infer<typeof expenseFormSchemaValues>;
export type ExpensesSearchParamsSchema = z.infer<
  typeof expensesSearchParamsSchema
>;
