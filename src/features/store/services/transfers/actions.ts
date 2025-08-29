'use server';

import { redirect } from 'next/navigation';
import { eq, and, inArray } from 'drizzle-orm';
import type {
  SchemaValidationFailure,
  SchemaValidationSuccess,
} from '@/types/index.types';
import type {
  MaterialTransferFormValues,
  StockMovementType,
} from '@/features/store/utils/store.types';
import { validateFields } from '@/lib/action-validator';
import { materialTransferFormSchema } from '@/features/store/utils/schema';
import db from '@/drizzle/db';
import {
  materialsTransferDetails,
  materialTransferHeader,
  stockMovements,
  stores,
  products,
} from '@/drizzle/schema';
import { dateFormat } from '@/lib/helpers/formatters';
import { revalidateTransfersTag } from '@/features/store/utils/cache';
import { getProductBalance } from '@/features/store/services/stores/data';
import { getCurrentUser } from '@/lib/session';

const validateData = (values: unknown) => {
  const { error, data } = validateFields<MaterialTransferFormValues>(
    values,
    materialTransferFormSchema
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
  } satisfies SchemaValidationSuccess<MaterialTransferFormValues>;
};

const validateBusinessLogic = async (data: MaterialTransferFormValues) => {
  const [fromStore, toStore] = await Promise.all([
    db.select().from(stores).where(eq(stores.id, data.fromStoreId)),
    db.select().from(stores).where(eq(stores.id, data.toStoreId)),
  ]);

  if (!fromStore.length || !toStore.length) {
    throw new Error('One or both stores do not exist');
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

export const createTransfer = async (values: unknown) => {
  const validation = validateData(values);
  const user = await getCurrentUser();
  if (!user) return { error: true, message: 'User not authenticated' };

  if (validation.error !== null) {
    return { error: true, message: validation.error };
  }

  const { data } = validation;
  const transferDate = dateFormat(data.transferDate);

  try {
    await validateBusinessLogic(data);
    const transferId = await db.transaction(async tx => {
      const stockChecks = await Promise.all(
        data.items.map(async ({ itemId, transferredQty }) => {
          const currentStockBalance = await getProductBalance(
            itemId,
            data.fromStoreId,
            new Date(transferDate)
          );

          if (currentStockBalance < transferredQty) {
            throw new Error(
              `Insufficient stock for item ${itemId}. Available: ${currentStockBalance}, Requested: ${transferredQty}`
            );
          }

          return { itemId, currentStockBalance };
        })
      );

      const [{ id }] = await tx
        .insert(materialTransferHeader)
        .values({
          fromStoreId: data.fromStoreId,
          toStoreId: data.toStoreId,
          transferDate: new Date(data.transferDate),
        })
        .returning({ id: materialTransferHeader.id });

      await tx.insert(materialsTransferDetails).values(
        data.items.map((item, index) => ({
          headerId: id,
          itemId: item.itemId,
          transferredQty: item.transferredQty.toString(),
          stockBalance: stockChecks[index].currentStockBalance.toString(),
          remarks: item.remarks || null,
        }))
      );
      await tx.insert(stockMovements).values(
        data.items.map(item => ({
          transactionDate: transferDate,
          itemId: item.itemId,
          qty: item.transferredQty.toString(),
          transactionType: 'TRANSFER' as StockMovementType,
          transactionId: id.toString(),
          createdBy: user.id,
          storeId: data.fromStoreId,
        }))
      );

      await tx.insert(stockMovements).values(
        data.items.map(item => ({
          transactionDate: transferDate,
          itemId: item.itemId,
          qty: item.transferredQty.toString(),
          transactionType: 'TRANSFER_IN' as StockMovementType,
          transactionId: id.toString(),
          createdBy: user.id,
          storeId: data.toStoreId,
        }))
      );

      return id;
    });

    revalidateTransfersTag(transferId);
  } catch (error) {
    console.error('Error creating transfer:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create transfer';
    return { error: true, message: errorMessage };
  }
  redirect(`/store/transfers`);
};
