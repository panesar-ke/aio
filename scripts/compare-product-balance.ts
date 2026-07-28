import 'dotenv/config';
import { and, eq, lte, sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

import * as schema from '@/drizzle/schema';
import { stockBalanceSnapshots, stockMovements } from '@/drizzle/schema';
import { signedQtySum } from '@/features/store/services/stock-balance/sign-convention';
import { sqlInList } from '@/features/store/services/stock-balance/utils';

const MOVEMENT_IN = ['GRN', 'TRANSFER_IN', 'CONVERSION_IN', 'OPENING_BAL'] as const;
const MOVEMENT_OUT = ['ISSUE', 'TRANSFER', 'CONVERSION_OUT'] as const;

type Db = NodePgDatabase<typeof schema>;

async function oldImpl(db: Db, productId: string, storeId: string, asOf: string) {
  const result = await db
    .select({
      balance: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${stockMovements.transactionType} IN ${sqlInList(MOVEMENT_IN)}
                THEN COALESCE(${stockMovements.qty},0)
              WHEN ${stockMovements.transactionType} IN ${sqlInList(MOVEMENT_OUT)}
                THEN -COALESCE(${stockMovements.qty},0)
              ELSE 0
            END
          ), 0
        )::float
      `,
    })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.itemId, productId),
        eq(stockMovements.storeId, storeId),
        lte(stockMovements.transactionDate, asOf),
        eq(stockMovements.isDeleted, false),
      ),
    );
  const value = Number(result[0]?.balance);
  return Number.isFinite(value) ? value : 0;
}

async function newImpl(db: Db, productId: string, storeId: string, asOf: string) {
  const result = await db.execute<{ balance: number }>(sql`
    WITH snap AS (
      SELECT ${stockBalanceSnapshots.snapshotDate} AS snapshot_date,
             ${stockBalanceSnapshots.closingBalance} AS closing_balance
      FROM ${stockBalanceSnapshots}
      WHERE ${stockBalanceSnapshots.itemId} = ${productId}
        AND ${stockBalanceSnapshots.storeId} = ${storeId}
        AND ${stockBalanceSnapshots.snapshotDate} <= ${asOf}
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
                AND ${stockMovements.transactionDate} <= ${asOf}
            ), 0
          )
      )::float AS balance
  `);
  const value = Number(result.rows[0]?.balance);
  return Number.isFinite(value) ? value : 0;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('BEGIN');
  const db = drizzle(client, { schema });

  try {
    const existingUser = await client.query('SELECT id FROM users LIMIT 1');
    const userId: string = existingUser.rows[0].id;

    async function makeProductAndStore(label: string) {
      const product = await client.query(
        'INSERT INTO products (product_name, category_id) VALUES ($1, 3) RETURNING id',
        [`__balance_verify_${label}__`],
      );
      const store = await client.query(
        'INSERT INTO stores (store_name, description) VALUES ($1, $2) RETURNING id',
        [`__balance_verify_${label}__`, 'temporary verification row'],
      );
      return { productId: product.rows[0].id as string, storeId: store.rows[0].id as string };
    }

    async function insertMovement(
      productId: string,
      storeId: string,
      date: string,
      type: string,
      qty: number,
    ) {
      await client.query(
        `INSERT INTO stock_movements
           (transaction_date, item_id, qty, transaction_type, transaction_id, created_by, store_id, is_deleted)
         VALUES ($1, $2, $3, $4, 'verify-script', $5, $6, false)`,
        [date, productId, qty, type, userId, storeId],
      );
    }

    async function insertSnapshot(
      productId: string,
      storeId: string,
      date: string,
      closingBalance: number,
    ) {
      await client.query(
        `INSERT INTO stock_balance_snapshots (item_id, store_id, snapshot_date, closing_balance)
         VALUES ($1, $2, $3, $4)`,
        [productId, storeId, date, closingBalance],
      );
    }

    // Case group 1: snapshots + movements before and after, boundary dates.
    const main1 = await makeProductAndStore('main');
    await insertMovement(main1.productId, main1.storeId, '2026-01-01', 'GRN', 100);
    await insertMovement(main1.productId, main1.storeId, '2026-01-05', 'ISSUE', 20);
    await insertSnapshot(main1.productId, main1.storeId, '2026-01-10', 80);
    await insertMovement(main1.productId, main1.storeId, '2026-01-15', 'GRN', 50);
    await insertMovement(main1.productId, main1.storeId, '2026-01-20', 'TRANSFER', 10);
    await insertSnapshot(main1.productId, main1.storeId, '2026-02-01', 120);

    // Case group 2: no snapshots yet — pure fallback path.
    const noSnapshot = await makeProductAndStore('no_snapshot');
    await insertMovement(noSnapshot.productId, noSnapshot.storeId, '2026-03-01', 'GRN', 40);

    // Case group 3: asOf predates any movement.
    const beforeAny = await makeProductAndStore('before_any');
    await insertMovement(beforeAny.productId, beforeAny.storeId, '2026-05-01', 'GRN', 40);

    const cases = [
      {
        name: 'snapshot with movements both before and after it',
        ...main1,
        asOf: '2026-01-25',
      },
      {
        name: "asOf exactly equals a snapshot's snapshot_date",
        ...main1,
        asOf: '2026-01-10',
      },
      {
        name: 'asOf falls between two snapshots',
        ...main1,
        asOf: '2026-01-27',
      },
      {
        name: 'no snapshots yet (fallback path)',
        ...noSnapshot,
        asOf: '2026-03-15',
      },
      {
        name: 'asOf before any movements exist (expect 0)',
        ...beforeAny,
        asOf: '2026-04-01',
      },
    ];

    let allPassed = true;
    for (const testCase of cases) {
      const oldValue = await oldImpl(db, testCase.productId, testCase.storeId, testCase.asOf);
      const newValue = await newImpl(db, testCase.productId, testCase.storeId, testCase.asOf);
      const pass = oldValue === newValue;
      if (!pass) allPassed = false;
      console.log(
        `${pass ? 'PASS' : 'FAIL'} — ${testCase.name}: old=${oldValue} new=${newValue}`,
      );
    }

    if (!allPassed) {
      throw new Error('Comparison mismatch detected — see FAIL lines above');
    }
    console.log('All comparison cases matched.');
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
