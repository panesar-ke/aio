'use cache';

import { eq, or, sql } from 'drizzle-orm';
import { cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';

import db from '@/drizzle/db';
import { stockBalanceSnapshots, stockMovements, stores } from '@/drizzle/schema';
import { signedQtySum } from '@/features/store/services/stock-balance/sign-convention';
import {
  getProductStockBalanceTags,
  getStoresGlobalTag,
  getStoresIdTag,
} from '@/features/store/utils/cache';
import { dateFormat } from '@/lib/helpers/formatters';

export const getStores = async (q?: string) => {
  cacheTag(getStoresGlobalTag());
  const query = db.select().from(stores);
  if (q) {
    query.where(
      or(
        sql`LOWER(${stores.storeName}) like ${`%${q.toLowerCase()}%`}`,
        sql`LOWER(${stores.description}) LIKE LOWER(${`%${q.toLowerCase()}%`})`,
      ),
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
  asOf: Date,
) => {
  cacheTag(
    'stock-balance',
    getProductStockBalanceTags(productId, storeId, asOf),
  );

  const formattedDate = dateFormat(asOf);

  const result = await db.execute<{ balance: number }>(sql`
    WITH snap AS (
      SELECT ${stockBalanceSnapshots.snapshotDate} AS snapshot_date,
             ${stockBalanceSnapshots.closingBalance} AS closing_balance
      FROM ${stockBalanceSnapshots}
      WHERE ${stockBalanceSnapshots.itemId} = ${productId}
        AND ${stockBalanceSnapshots.storeId} = ${storeId}
        AND ${stockBalanceSnapshots.snapshotDate} <= ${formattedDate}
      ORDER BY ${stockBalanceSnapshots.snapshotDate} DESC
      LIMIT 1
    )
    SELECT
      (
        COALESCE((SELECT closing_balance FROM snap), 0)
        + COALESCE(
            (
              SELECT ${signedQtySum(stockMovements)}
              FROM ${stockMovements}
              WHERE ${stockMovements.itemId} = ${productId}
                AND ${stockMovements.storeId} = ${storeId}
                AND ${stockMovements.isDeleted} = false
                AND ${stockMovements.transactionDate} > COALESCE((SELECT snapshot_date FROM snap), '1900-01-01')
                AND ${stockMovements.transactionDate} <= ${formattedDate}
            ), 0
          )
      )::float AS balance
  `);

  const value = Number(result.rows[0]?.balance);
  return Number.isFinite(value) ? value : 0;
};

export async function getMainStore() {
  cacheTag(getStoresGlobalTag());
  const mainStore = await db.query.stores.findFirst({
    columns: { id: true, storeName: true },
    where: (stores, { eq }) => eq(stores.isMain, true),
  });
  if (!mainStore) {
    notFound();
  }
  return { value: mainStore.id, label: mainStore.storeName.toUpperCase() };
}
