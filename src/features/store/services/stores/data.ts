'use cache';

import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { eq, or, sql } from 'drizzle-orm';
import {
  getStoresGlobalTag,
  getStoresIdTag,
} from '@/features/store/utils/cache';
import db from '@/drizzle/db';
import { stores } from '@/drizzle/schema';

export const getStores = async (q?: string) => {
  cacheTag(getStoresGlobalTag());
  const query = db.select().from(stores);
  if (q) {
    query.where(
      or(
        sql`LOWER(${stores.storeName}) like ${`%${q.toLowerCase()}%`}`,
        sql`LOWER(${stores.description}) LIKE LOWER(${`%${q.toLowerCase()}%`})`
      )
    );
  }
  return query.orderBy(sql`LOWER(${stores.storeName})`);
};

export const getStore = async (storeId: string) => {
  cacheTag(getStoresIdTag(storeId));
  return db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  });
};
