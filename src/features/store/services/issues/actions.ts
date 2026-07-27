'use server';

import { and, eq, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import type {
  MaterialIssueFormValues,
  StockMovementType,
} from '@/features/store/utils/store.types';
import type {
  SchemaValidationFailure,
  SchemaValidationSuccess,
} from '@/types/index.types';

import db from '@/drizzle/db';
import {
  materialIssuesHeader,
  products,
  stockMovements,
  stores,
} from '@/drizzle/schema';
import { getMaterialIssueNumber } from '@/features/store/services/issues/data';
import { invalidateStockBalanceSnapshots } from '@/features/store/services/stock-balance/utils';
import { getProductBalance } from '@/features/store/services/stores/data';
import { revalidateMaterialsIssues } from '@/features/store/utils/cache';
import { materialIssueFormSchema } from '@/features/store/utils/schema';
import { validateFields } from '@/lib/action-validator';
import { dateFormat } from '@/lib/helpers/formatters';
import { getCurrentUser } from '@/lib/session';

const validateData = (values: unknown) => {
  const { error, data } = validateFields<MaterialIssueFormValues>(
    values,
    materialIssueFormSchema
  );

  if (error !== null) {
    return {
      data: null,
      error: 'Validation failed. Ensure all fields provided are valid.',
    } satisfies SchemaValidationFailure;
  }

  return {
    data,
    error: null,
  } satisfies SchemaValidationSuccess<MaterialIssueFormValues>;
};

const validateBusinessLogic = async (data: MaterialIssueFormValues) => {
  const fromStore = await db
    .select()
    .from(stores)
    .where(eq(stores.id, data.fromStoreId));

  if (!fromStore.length) {
    throw new Error('Source store does not exist');
  }

  const itemIds = data.items.map(item => item.itemId);
  const existingItems = await db
    .select()
    .from(products)
    .where(
      and(
        inArray(products.id, itemIds),
        eq(products.active, true),
        eq(products.stockItem, true)
      )
    );

  if (existingItems.length !== itemIds.length) {
    throw new Error(
      'One or more items do not exist or are not active stock items'
    );
  }
};

export const createIssue = async (values: unknown) => {
  const validation = validateData(values);
  const user = await getCurrentUser();
  if (!user) return { error: true, message: 'User not authenticated' };

  if (validation.error !== null) {
    return { error: true, message: validation.error };
  }

  const { data } = validation;
  const issueDate = dateFormat(data.issueDate);
  const issueNo = await getMaterialIssueNumber();

  try {
    await validateBusinessLogic(data);
    const issueId = await db.transaction(async tx => {
      await Promise.all(
        data.items.map(async ({ itemId, issuedQty }) => {
          const currentStockBalance = await getProductBalance(
            itemId,
            data.fromStoreId,
            new Date(issueDate)
          );

          if (currentStockBalance < +issuedQty) {
            throw new Error(
              `Insufficient stock for item ${itemId}. Available: ${currentStockBalance}, Requested: ${issuedQty}`
            );
          }

          return { itemId, currentStockBalance };
        })
      );

      const [{ id }] = await tx
        .insert(materialIssuesHeader)
        .values({
          issueNo,
          storeId: data.fromStoreId,
          staffName: data.staffIssued,
          jobcardNo: data.jobcardNo || null,
          issueDate,
          text: data.notes || null,
          issuedBy: user.id,
        })
        .returning({ id: materialIssuesHeader.id });

      const issueMovements = data.items.map(item => ({
        transactionDate: issueDate,
        itemId: item.itemId,
        qty: item.issuedQty.toString(),
        transactionType: 'ISSUE' as StockMovementType,
        transactionId: id.toString(),
        createdBy: user.id,
        storeId: data.fromStoreId,
        remarks: item.remarks || null,
      }));

      await tx.insert(stockMovements).values(issueMovements);
      await invalidateStockBalanceSnapshots(tx, issueMovements);

      return id;
    });

    revalidateMaterialsIssues(issueId);
  } catch (error) {
    console.error('Error creating transfer:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create transfer';
    return { error: true, message: errorMessage };
  }
  redirect(`/store/issues`);
};

export const updateIssue = async (issueId: string, values: unknown) => {
  const validation = validateData(values);
  const user = await getCurrentUser();
  if (!user) return { error: true, message: 'User not authenticated' };

  if (validation.error !== null) {
    return { error: true, message: validation.error };
  }

  const { data } = validation;
  const issueDate = dateFormat(data.issueDate);

  try {
    await validateBusinessLogic(data);
    await db.transaction(async tx => {
      const removedMovements = await tx
        .select({
          itemId: stockMovements.itemId,
          storeId: stockMovements.storeId,
          transactionDate: stockMovements.transactionDate,
        })
        .from(stockMovements)
        .where(
          and(
            eq(stockMovements.transactionId, issueId),
            eq(stockMovements.transactionType, 'ISSUE')
          )
        );

      await tx
        .update(materialIssuesHeader)
        .set({
          storeId: data.fromStoreId,
          staffName: data.staffIssued,
          jobcardNo: data.jobcardNo || null,
          issueDate,
          text: data.notes || null,
        })
        .where(eq(materialIssuesHeader.id, issueId));

      await tx
        .delete(stockMovements)
        .where(
          and(
            eq(stockMovements.transactionId, issueId),
            eq(stockMovements.transactionType, 'ISSUE')
          )
        );

      const replacementMovements = data.items.map(item => ({
        transactionDate: issueDate,
        itemId: item.itemId,
        qty: item.issuedQty.toString(),
        transactionType: 'ISSUE' as StockMovementType,
        transactionId: issueId,
        createdBy: user.id,
        storeId: data.fromStoreId,
        remarks: item.remarks || null,
      }));

      await tx.insert(stockMovements).values(replacementMovements);
      await invalidateStockBalanceSnapshots(tx, [
        ...removedMovements,
        ...replacementMovements,
      ]);
    });

    revalidateMaterialsIssues(issueId);
  } catch (error) {
    console.error('Error updating transfer:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update transfer';
    return { error: true, message: errorMessage };
  }
  redirect(`/store/issues`);
};

export const deleteIssue = async (issueId: string) => {
  const user = await getCurrentUser();
  if (!user) return { error: true, message: 'User not authenticated' };

  try {
    await db.transaction(async tx => {
      const removedMovements = await tx
        .select({
          itemId: stockMovements.itemId,
          storeId: stockMovements.storeId,
          transactionDate: stockMovements.transactionDate,
        })
        .from(stockMovements)
        .where(
          and(
            eq(stockMovements.transactionId, issueId),
            eq(stockMovements.transactionType, 'ISSUE')
          )
        );

      await tx
        .delete(materialIssuesHeader)
        .where(eq(materialIssuesHeader.id, issueId));

      await tx
        .delete(stockMovements)
        .where(
          and(
            eq(stockMovements.transactionId, issueId),
            eq(stockMovements.transactionType, 'ISSUE')
          )
        );
      await invalidateStockBalanceSnapshots(tx, removedMovements);
    });

    revalidateMaterialsIssues(issueId);
    return { error: false, message: 'Issue deleted successfully' };
  } catch (error) {
    console.error('Error deleting transfer:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete transfer';
    return { error: true, message: errorMessage };
  }
};
