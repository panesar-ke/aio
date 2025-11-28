'use cache';

import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { and, eq, lte, or, sql } from 'drizzle-orm';
import {
  getProductStockBalanceTags,
  getStoresGlobalTag,
  getStoresIdTag,
} from '@/features/store/utils/cache';
import db from '@/drizzle/db';
import { stockMovements, stores } from '@/drizzle/schema';
import { dateFormat } from '@/lib/helpers/formatters';
import { notFound } from 'next/navigation';

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

export const getProductBalance = async (
  productId: string,
  storeId: string,
  asOf: Date
) => {
  cacheTag(
    'stock-balance',
    getProductStockBalanceTags(productId, storeId, asOf)
  );

  const movementIn = [
    'GRN',
    'TRANSFER_IN',
    'CONVERSION_IN',
    'OPENING_BAL',
  ] as const;

  const movementOut = ['ISSUE', 'TRANSFER', 'CONVERSION_OUT'] as const;

  const formattedDate = dateFormat(asOf);

  const result = await db
    .select({
      balance: sql<number>`
        COALESCE(SUM(
          CASE
            WHEN ${stockMovements.transactionType} IN ${movementIn} THEN ${stockMovements.qty}
            WHEN ${stockMovements.transactionType} IN ${movementOut} THEN -${stockMovements.qty}
            ELSE 0
          END
        ), 0)
      `,
    })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.itemId, productId),
        eq(stockMovements.storeId, storeId),
        lte(stockMovements.transactionDate, formattedDate),
        eq(stockMovements.isDeleted, false)
      )
    )
    .then(d => d[0]?.balance ?? 0);

  return result;
};

export async function getMainStore() {
  cacheTag(getStoresGlobalTag());
  const mainStore = await db.query.stores.findFirst({
    columns: { id: true, storeName: true },
    where: (stores, { eq }) => eq(stores.storeName, 'main store'),
  });
  if (!mainStore) {
    notFound();
  }
  return { value: mainStore.id, label: mainStore.storeName.toUpperCase() };
}
