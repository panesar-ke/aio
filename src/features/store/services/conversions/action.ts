'use server';

import { validateFields } from '@/lib/action-validator';
import type {
  ConversionFormValues,
  StockMovementType,
} from '@/features/store/utils/store.types';
import { conversionSchema } from '@/features/store/utils/schema';
import { getMainStore } from '@/features/store/services/stores/data';
import type {
  SchemaValidationFailure,
  SchemaValidationSuccess,
} from '@/types/index.types';
import { getCurrentUser } from '@/lib/session';
import { getProductBalance } from '@/features/store/services/stores/data';
import { dateFormat } from '@/lib/helpers/formatters';
import { conversions, stockMovements } from '@/drizzle/schema';
import db from '@/drizzle/db';

const validateData = (values: unknown) => {
  const { error, data } = validateFields<ConversionFormValues>(
    values,
    conversionSchema
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
  } satisfies SchemaValidationSuccess<ConversionFormValues>;
};

export async function createConversion(values: unknown) {
  const validation = validateData(values);
  const [user, { value: mainStoreId }] = await Promise.all([
    getCurrentUser(),
    getMainStore(),
  ]);
  if (!user) return { error: true, message: 'User not authenticated' };

  if (validation.error !== null) {
    return { error: true, message: validation.error };
  }

  const {
    data: { conversionDate, convertedQty, convertingItems, finalProduct },
  } = validation;
  let underStock = 0;
  const promises = convertingItems.map(async item => {
    const currentBalance = await getProductBalance(
      item.itemId,
      mainStoreId,
      conversionDate
    );
    if (Number(currentBalance) < parseFloat(item.convertingQty.toString())) {
      underStock += 1;
    }
  });

  await Promise.all(promises);

  if (underStock > 0) {
    return {
      error: true,
      message: `${underStock} item(s) have less stock than issued.`,
    };
  }

  const formattedConversionDate = dateFormat(conversionDate);

  const isSuccess = await db.transaction(async tx => {
    const conversion = await tx
      .insert(conversions)
      .values({
        conversionDate: formattedConversionDate,
        convertedItem: finalProduct,
        convertedQuantity: convertedQty.toString(),
      })
      .returning();

    const movementIn = await tx
      .insert(stockMovements)
      .values({
        itemId: finalProduct,
        qty: convertedQty.toString(),
        transactionDate: formattedConversionDate,
        transactionType: 'CONVERSION_IN',
        transactionId: conversion[0].id,
        createdBy: user.id,
        storeId: '0d5d9239-a507-4147-8725-bcf0401e21ee',
      })
      .returning();

    const itemsConvertingFrom = convertingItems.map(item => ({
      itemId: item.itemId,
      qty: item.convertingQty.toString(),
      transactionDate: formattedConversionDate,
      transactionType: 'CONVERSION_OUT' as StockMovementType,
      transactionId: conversion[0].id,
      createdBy: user.id,
      storeId: '0d5d9239-a507-4147-8725-bcf0401e21ee',
    }));

    const movementOut = await tx
      .insert(stockMovements)
      .values(itemsConvertingFrom)
      .returning();

    return !!conversion.length && !!movementIn.length && !!movementOut.length;
  });

  if (!isSuccess)
    return { error: true, message: 'Conversion failed. Please try again.' };

  return { error: false, message: 'Successfully converted.' };
}
