'use server';

import { validateFields } from '@/lib/action-validator';
import { autoOrdersSchema } from '@/features/procurement/utils/schemas';
import db from '@/drizzle/db';
import { autoOrdersItems } from '@/drizzle/schema';
import { revalidateAutoOrder } from '@/features/procurement/utils/cache';
import { redirect } from 'next/navigation';

export const createAutoOrder = async (values: unknown) => {
  const { data, error } = validateFields(values, autoOrdersSchema);
  if (error !== null) {
    return {
      error: true,
      message: 'There was an error validating the form data',
    };
  }

  const formattedData = data.items.map(item => ({
    id: crypto.randomUUID(),
    productId: item.productId,
    vendorId: item.vendorId,
    reorderLevel: item.reorderLevel.toString(),
    reorderQty: item.reorderQty.toString(),
  }));

  try {
    await db.transaction(async tx => {
      await tx.delete(autoOrdersItems);
      await tx.insert(autoOrdersItems).values(formattedData);
    });

    revalidateAutoOrder();
  } catch (error) {
    console.error('Error creating auto order:', error);
    return {
      error: true,
      message: 'There was an error creating the auto order',
    };
  }
  redirect('/procurement/auto-orders');
};
