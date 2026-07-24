import { sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import {
  getSnapshotInvalidationCondition,
  getSnapshotInvalidationScopes,
  invalidateStockBalanceSnapshots,
  sqlInList,
} from '@/features/store/services/stock-balance/utils';

const dialect = new PgDialect();

describe('sqlInList', () => {
  it('expands values into a parenthesized PostgreSQL parameter list', () => {
    const query = dialect.sqlToQuery(
      sql`SELECT 1 WHERE item_id IN ${sqlInList(['item-1', 'item-2'])}`,
    );

    expect(query.sql).toBe('SELECT 1 WHERE item_id IN ($1, $2)');
    expect(query.params).toEqual(['item-1', 'item-2']);
  });
});

describe('getSnapshotInvalidationScopes', () => {
  it('keeps the earliest changed date for each item and store', () => {
    expect(
      getSnapshotInvalidationScopes([
        {
          itemId: 'item-1',
          storeId: 'store-1',
          transactionDate: '2026-07-10',
        },
        {
          itemId: 'item-1',
          storeId: 'store-1',
          transactionDate: '2026-07-03',
        },
        {
          itemId: 'item-1',
          storeId: 'store-2',
          transactionDate: '2026-07-08',
        },
      ]),
    ).toEqual([
      {
        itemId: 'item-1',
        storeId: 'store-1',
        fromDate: '2026-07-03',
      },
      {
        itemId: 'item-1',
        storeId: 'store-2',
        fromDate: '2026-07-08',
      },
    ]);
  });

  it('builds a grouped delete condition for each affected item and store', () => {
    const condition = getSnapshotInvalidationCondition([
      {
        itemId: 'item-1',
        storeId: 'store-1',
        fromDate: '2026-07-03',
      },
      {
        itemId: 'item-2',
        storeId: 'store-2',
        fromDate: '2026-07-08',
      },
    ]);
    const query = dialect.sqlToQuery(sql`DELETE FROM snapshots WHERE ${condition}`);

    expect(query.sql).toContain(' or ');
    expect(query.sql.match(/snapshot_date" >=/g)).toHaveLength(2);
    expect(query.params).toEqual([
      'item-1',
      'store-1',
      '2026-07-03',
      'item-2',
      'store-2',
      '2026-07-08',
    ]);
  });

  it('does not issue a snapshot delete when no movement has a store', async () => {
    let deleteCalled = false;
    const executor = {
      delete: () => {
        deleteCalled = true;
        return {
          where: async () => undefined,
        };
      },
    };

    await invalidateStockBalanceSnapshots(executor, [
      {
        itemId: 'item-1',
        storeId: null,
        transactionDate: '2026-07-03',
      },
    ]);

    expect(deleteCalled).toBe(false);
  });
});
