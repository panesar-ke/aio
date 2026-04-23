'use server';

import { validateFields } from '@/lib/action-validator';
import type {
  ExpenseCategorySchema,
  ExpenseSubCategorySchema,
} from '@/features/it/utils/expenses/schemas';
import {
  expenseCategorySchema,
  expenseSubCategorySchema,
} from '@/features/it/utils/expenses/schemas';
import db from '@/drizzle/db';
import { itCategories, itSubCategories } from '@/drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';

export const createExpenseCategory = async (values: unknown) => {
  try {
    const { data, error } = validateFields<ExpenseCategorySchema>(
      values,
      expenseCategorySchema,
    );

    if (error !== null) {
      return {
        error: true,
        message: error,
      };
    }

    const category = await db.query.itCategories.findFirst({
      where: eq(
        sql`lower(${itCategories.name})`,
        data.name.trim().toLowerCase(),
      ),
    });

    if (category) {
      return {
        error: true,
        message: 'Category already exists.',
      };
    }

    const [{ id }] = await db
      .insert(itCategories)
      .values({ ...data })
      .returning({ id: itCategories.id });

    return {
      error: false,
      message: 'Expense category created successfully.',
      data: { id },
    };
  } catch (error) {
    console.error('Error creating expense category:', error);
    return {
      error: true,
      message: 'Failed to create expense category. Please try again.',
    };
  }
};

export const createExpenseSubCategory = async (values: unknown) => {
  try {
    const { data, error } = validateFields<ExpenseSubCategorySchema>(
      values,
      expenseSubCategorySchema,
    );

    if (error !== null) {
      return {
        error: true,
        message: error,
      };
    }

    const subCategory = await db.query.itSubCategories.findFirst({
      where: and(
        eq(sql`lower(${itSubCategories.name})`, data.name.trim().toLowerCase()),
        eq(itSubCategories.categoryId, data.categoryId),
      ),
    });

    if (subCategory) {
      return {
        error: true,
        message: 'Sub-category already exists for this category.',
      };
    }

    const [{ id }] = await db
      .insert(itSubCategories)
      .values({ ...data })
      .returning({ id: itSubCategories.id });

    return {
      error: false,
      message: 'Expense sub-category created successfully.',
      data: { id },
    };
  } catch (error) {
    console.error('Error creating expense sub-category:', error);
    return {
      error: true,
      message: 'Failed to create expense sub-category. Please try again.',
    };
  }
};
