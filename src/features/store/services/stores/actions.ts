'use server';

import { count, eq } from 'drizzle-orm';

import type { StoreFormValues } from '@/features/store/utils/store.types';

import db from '@/drizzle/db';
import { stockMovements, stores } from '@/drizzle/schema';
import { getStore } from '@/features/store/services/stores/data';
import { revalidateStoresTag } from '@/features/store/utils/cache';
import { storeFormSchema } from '@/features/store/utils/schema';
import { parseOrFail, runAction } from '@/lib/actions/safe-action';
import { requireAnyPermission } from '@/lib/permissions/guards';
import { normalizeString } from '@/lib/string-normalizers';

const buildStorePayload = (values: StoreFormValues) => {
  return {
    storeName: normalizeString(values.storeName),
    description: normalizeString(values.description),
  };
};

export const upsertStore = async (values: unknown) =>
  runAction('upsert-store', async () => {
    await requireAnyPermission(['store:admin', 'store:standard']);
    const data = parseOrFail(storeFormSchema, values);

    if (data.id) {
      const store = await getStore(data.id);
      if (!store) {
        return {
          error: true,
          message: 'Store not found. It may have been deleted.',
        };
      }

      await db
        .update(stores)
        .set(buildStorePayload(data))
        .where(eq(stores.id, data.id));

      revalidateStoresTag(data.id);
      return {
        error: false,
        message: 'Store updated successfully.',
      };
    }

    const [{ id }] = await db
      .insert(stores)
      .values(buildStorePayload(data))
      .returning({ id: stores.id });

    revalidateStoresTag(id);
    return { error: false, message: 'Store created successfully.' };
  });

export const deleteStore = async (storeId: string) =>
  runAction('delete-store', async () => {
    await requireAnyPermission(['store:admin']);
    const store = await getStore(storeId);
    if (!store) {
      return {
        error: true,
        message: 'Store not found. It may have already been deleted.',
      };
    }

    const [{ count: totalCount }] = await db
      .select({ count: count(stockMovements.id) })
      .from(stockMovements)
      .where(eq(stockMovements.storeId, storeId));

    if (totalCount > 0) {
      return {
        error: true,
        message: 'Cannot delete store with existing stock movements.',
      };
    }

    await db.delete(stores).where(eq(stores.id, storeId));
    revalidateStoresTag(storeId);

    return {
      error: false,
      message: 'Store deleted successfully!',
    };
  });
