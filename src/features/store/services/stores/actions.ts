'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import type { StoreFormValues } from '@/features/store/utils/store.types';
import { validateFields } from '@/lib/action-validator';
import { storeFormSchema } from '@/features/store/utils/schema';
import db from '@/drizzle/db';
import { stores } from '@/drizzle/schema';
import { revalidateStoresTag } from '@/features/store/utils/cache';
import { getStore } from '@/features/store/services/stores/data';

type ActionResult =
  | {
      error: boolean;
      message: string;
    }
  | never;

const validateStoreData = (values: StoreFormValues) => {
  const { error, data } = validateFields<StoreFormValues>(
    values,
    storeFormSchema
  );

  if (error !== null) {
    return {
      isValid: false,
      error: {
        error: true,
        message: 'Invalid store data. Please check all required fields.',
      },
      data: null,
    };
  }

  return {
    isValid: true,
    error: null,
    data,
  };
};

const handleDatabaseError = (
  error: unknown,
  operation: string
): ActionResult => {
  console.error(`Failed to ${operation} store:`, error);
  return {
    error: true,
    message: `Failed to ${operation} store. Please try again.`,
  };
};

export const createStore = async (
  values: StoreFormValues
): Promise<ActionResult> => {
  const validation = validateStoreData(values);
  if (!validation.isValid) {
    return validation.error!;
  }

  try {
    const [{ id }] = await db
      .insert(stores)
      .values(validation.data!)
      .returning({ id: stores.id });

    revalidateStoresTag(id);
  } catch (error) {
    return handleDatabaseError(error, 'create');
  }

  return redirect('/store/stores');
};

export const updateStore = async (
  id: string,
  values: StoreFormValues
): Promise<ActionResult> => {
  const validation = validateStoreData(values);
  if (!validation.isValid) {
    return validation.error!;
  }

  const store = await getStore(id);
  if (!store) {
    return {
      error: true,
      message: 'Store not found. It may have been deleted.',
    };
  }

  try {
    await db
      .update(stores)
      .set(validation.data!)
      .where(eq(stores.id, id))
      .returning({ id: stores.id });

    revalidateStoresTag(id);
  } catch (error) {
    return handleDatabaseError(error, 'update');
  }

  return redirect('/store/stores');
};

export const deleteStore = async (id: string): Promise<ActionResult> => {
  try {
    const store = await getStore(id);
    if (!store) {
      return {
        error: true,
        message: 'Store not found. It may have already been deleted.',
      };
    }

    // TODO: Implement business logic to check for referenced store in stock movements table

    await db.delete(stores).where(eq(stores.id, id));
    revalidateStoresTag(id);
  } catch (error) {
    return handleDatabaseError(
      error,
      'Cannot delete store with existing stock movements. Please remove all references first.'
    );
  }

  return redirect('/store/stores');
};
