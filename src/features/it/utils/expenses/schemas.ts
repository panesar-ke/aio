import { z } from 'zod';

export const expenseCategorySchema = z.object({
  name: z.string().min(3, 'Category name must be at least 3 characters'),
  description: z.string().nullish(),
});

export const expenseSubCategorySchema = z.object({
  name: z.string().min(3, 'Sub-category name must be at least 3 characters'),
  categoryId: z.string().min(1, 'Category is required'),
});

export type ExpenseCategorySchema = z.infer<typeof expenseCategorySchema>;
export type ExpenseSubCategorySchema = z.infer<typeof expenseSubCategorySchema>;
