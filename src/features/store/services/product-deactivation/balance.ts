import { and, eq, isNotNull } from 'drizzle-orm';

import db from '@/drizzle/db';
import { stockMovements } from '@/drizzle/schema';
import { getProductBalance } from '@/features/store/services/stores/data';

export async function listStoreIdsWithMovements(
  productId: string,
): Promise<Array<string>> {
  const rows = await db
    .selectDistinct({ storeId: stockMovements.storeId })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.itemId, productId),
        isNotNull(stockMovements.storeId),
      ),
    );

  return rows
    .map(row => row.storeId)
    .filter((storeId): storeId is string => storeId !== null);
}

export interface BalanceDeps {
  listStoreIds: (productId: string) => Promise<Array<string>>;
  getBalance: (
    productId: string,
    storeId: string,
    asOf: Date,
  ) => Promise<number>;
}

const defaultDeps: BalanceDeps = {
  listStoreIds: listStoreIdsWithMovements,
  getBalance: getProductBalance,
};

export async function sumProductBalanceAcrossStores(
  productId: string,
  asOf: Date,
  deps: BalanceDeps = defaultDeps,
): Promise<number> {
  const storeIds = await deps.listStoreIds(productId);

  if (storeIds.length === 0) {
    return 0;
  }

  const balances = await Promise.all(
    storeIds.map(storeId => deps.getBalance(productId, storeId, asOf)),
  );

  return balances.reduce((sum, balance) => sum + balance, 0);
}
