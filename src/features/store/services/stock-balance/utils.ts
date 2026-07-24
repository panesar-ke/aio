import { and, eq, gte, or, sql, type SQL } from 'drizzle-orm';

import { stockBalanceSnapshots } from '@/drizzle/schema';

export interface SnapshotAffectingMovement {
  itemId: string;
  storeId: string | null;
  transactionDate: string;
}

export interface SnapshotInvalidationScope {
  itemId: string;
  storeId: string;
  fromDate: string;
}

interface SnapshotDeleteExecutor {
  delete: (table: typeof stockBalanceSnapshots) => {
    where: (condition: SQL | undefined) => PromiseLike<unknown>;
  };
}

export const sqlInList = (values: ReadonlyArray<unknown>): SQL =>
  sql`(${sql.join(
    values.map(value => sql`${value}`),
    sql`, `,
  )})`;

export const getSnapshotInvalidationScopes = (
  movements: ReadonlyArray<SnapshotAffectingMovement>,
): Array<SnapshotInvalidationScope> => {
  const scopes = new Map<string, SnapshotInvalidationScope>();

  for (const movement of movements) {
    if (!movement.storeId) continue;

    const key = `${movement.itemId}:${movement.storeId}`;
    const current = scopes.get(key);
    if (!current || movement.transactionDate < current.fromDate) {
      scopes.set(key, {
        itemId: movement.itemId,
        storeId: movement.storeId,
        fromDate: movement.transactionDate,
      });
    }
  }

  return [...scopes.values()];
};

export const getSnapshotInvalidationCondition = (
  scopes: ReadonlyArray<SnapshotInvalidationScope>,
): SQL | undefined =>
  or(
    ...scopes.map(scope =>
      and(
        eq(stockBalanceSnapshots.itemId, scope.itemId),
        eq(stockBalanceSnapshots.storeId, scope.storeId),
        gte(stockBalanceSnapshots.snapshotDate, scope.fromDate),
      ),
    ),
  );

export const invalidateStockBalanceSnapshots = async (
  executor: SnapshotDeleteExecutor,
  movements: ReadonlyArray<SnapshotAffectingMovement>,
): Promise<void> => {
  const scopes = getSnapshotInvalidationScopes(movements);
  if (scopes.length === 0) return;

  await executor
    .delete(stockBalanceSnapshots)
    .where(getSnapshotInvalidationCondition(scopes));
};
