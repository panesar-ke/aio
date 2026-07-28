/**
 * One-time backfill: populates stock_balance_snapshots with a closing
 * balance as of yesterday for every (item_id, store_id) pair that has
 * movement history. Run once before enabling the nightly snapshot cron
 * (`/api/cron/stock-balance-snapshot`) — after this has run, that job only
 * ever has to sum small deltas instead of full history.
 *
 * Usage: pnpm backfill:stock-snapshots
 */
import 'dotenv/config';
import { sql } from 'drizzle-orm';

import db from '@/drizzle/db';
import { stockBalanceSnapshots, stockMovements } from '@/drizzle/schema';
import { signedQtySum } from '@/features/store/services/stock-balance/sign-convention';

async function main() {
  const result = await db.execute(sql`
    INSERT INTO ${stockBalanceSnapshots} (item_id, store_id, snapshot_date, closing_balance)
    SELECT
      ${stockMovements.itemId},
      ${stockMovements.storeId},
      CURRENT_DATE - INTERVAL '1 day',
      ${signedQtySum(stockMovements)}
    FROM ${stockMovements}
    WHERE ${stockMovements.isDeleted} = false
      AND ${stockMovements.storeId} IS NOT NULL
      AND ${stockMovements.transactionDate} <= CURRENT_DATE - INTERVAL '1 day'
    GROUP BY ${stockMovements.itemId}, ${stockMovements.storeId}
    ON CONFLICT (item_id, store_id, snapshot_date)
    DO UPDATE SET closing_balance = EXCLUDED.closing_balance
  `);

  console.log(`Backfilled ${result.rowCount} item/store snapshot rows.`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
