'use server';

import { and, eq, ne, sql } from 'drizzle-orm';

import db from '@/drizzle/db';
import { itCategories, itExpenses, itSubCategories } from '@/drizzle/schema';
import {
  expenseCategorySchema,
  expenseFormSchemaValues,
  expenseSubCategorySchema,
} from '@/features/it/utils/expenses/schemas';
import { parseOrFail, runAction } from '@/lib/actions/safe-action';
import {
  requireAnyPermission,
  requirePermission,
} from '@/lib/permissions/guards';
import {
  normalizeNullableString,
  normalizeString,
} from '@/lib/string-normalizers';

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === '23505';

export const createExpenseCategory = async (values: unknown) =>
  runAction('create expense category', async () => {
    await requirePermission('it:admin');

    const data = parseOrFail(expenseCategorySchema, values);
    const normalizedName = normalizeString(data.name);

    const category = await db.query.itCategories.findFirst({
      where: eq(sql`lower(${itCategories.name})`, normalizedName.toLowerCase()),
    });

    if (category) {
      return {
        error: true,
        message: 'Category already exists.',
      };
    }

    try {
      const [{ id }] = await db
        .insert(itCategories)
        .values({
          ...data,
          name: normalizedName,
        })
        .returning({ id: itCategories.id });

      return {
        error: false,
        message: 'Expense category created successfully.',
        data: { id },
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return {
          error: true,
          message: 'Category already exists.',
        };
      }

      throw error;
    }
  });

export const createExpenseSubCategory = async (values: unknown) =>
  runAction('create expense sub-category', async () => {
    await requirePermission('it:admin');

    const data = parseOrFail(expenseSubCategorySchema, values);
    const normalizedName = normalizeString(data.name);

    const subCategory = await db.query.itSubCategories.findFirst({
      where: and(
        eq(sql`lower(${itSubCategories.name})`, normalizedName.toLowerCase()),
        eq(itSubCategories.categoryId, data.categoryId),
      ),
    });

    if (subCategory) {
      return {
        error: true,
        message: 'Sub-category already exists for this category.',
      };
    }

    try {
      const [{ id }] = await db
        .insert(itSubCategories)
        .values({
          ...data,
          name: normalizedName,
        })
        .returning({ id: itSubCategories.id });

      return {
        error: false,
        message: 'Expense sub-category created successfully.',
        data: { id },
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return {
          error: true,
          message: 'Sub-category already exists for this category.',
        };
      }

      throw error;
    }
  });

export const upsertExpense = async (values: unknown) =>
  runAction('upsert-expense', async () => {
    await requireAnyPermission(['it:admin', 'it:standard']);

    const data = parseOrFail(expenseFormSchemaValues, values);
    const normalizedName = normalizeString(data.referenceNo);

    const existing = await db.query.itExpenses.findFirst({
      where: and(
        eq(sql`lower(${itExpenses.referenceNo})`, normalizedName.toLowerCase()),
        data.id ? ne(itExpenses.id, data.id) : undefined,
      ),
    });

    if (existing) {
      return {
        error: true,
        message: 'Reference number already exists.',
      };
    }

    try {
      const [{ id }] = await db
        .insert(itExpenses)
        .values({
          ...data,
          referenceNo: normalizedName,
          amount: data.amount.toString(),
          description: normalizeNullableString(data.description),
          title: normalizeString(data.title),
        })
        .onConflictDoUpdate({
          target: itExpenses.id,
          set: {
            ...data,
            referenceNo: normalizedName,
            amount: data.amount.toString(),
            description: normalizeNullableString(data.description),
            title: normalizeString(data.title),
          },
        })
        .returning({ id: itExpenses.id });

      return {
        error: false,
        message: `Expense ${data.id ? 'updated' : 'created'} successfully.`,
        data: { id },
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return {
          error: true,
          message: 'Expense already exists.',
        };
      }

      throw error;
    }
  });

export const deleteExpense = async (id: string) =>
  runAction('delete expense', async () => {
    await requirePermission('it:admin');

    const expense = await db.query.itExpenses.findFirst({
      columns: { id: true },
      where: eq(itExpenses.id, id),
    });

    if (!expense?.id) {
      return {
        error: true,
        message: 'Expense not found.',
      };
    }

    try {
      await db.delete(itExpenses).where(eq(itExpenses.id, expense.id));

      return {
        error: false,
        message: 'Expense deleted successfully.',
      };
    } catch (error) {
      throw error;
    }
  });
