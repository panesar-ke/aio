import { sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

import db from '@/drizzle/db';
import { stockBalanceSnapshots, stockMovements } from '@/drizzle/schema';
import { env } from '@/env/server';
import { signedQtySum } from '@/features/store/services/stock-balance/sign-convention';
import { getCronSecret } from '@/lib/cron-token';

export async function GET(request: NextRequest) {
  const token = getCronSecret(request);
  if (!env.CRON_SECRET || !token || token !== env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const result = await db.execute(sql`
    WITH last_snapshot AS (
      SELECT DISTINCT ON (item_id, store_id)
        item_id, store_id, snapshot_date, closing_balance
      FROM ${stockBalanceSnapshots}
      ORDER BY item_id, store_id, snapshot_date DESC
    ),
    deltas AS (
      SELECT
        sm.item_id,
        sm.store_id,
        ${signedQtySum({ transactionType: sql`sm.transaction_type`, qty: sql`sm.qty` })} AS net_change
      FROM ${stockMovements} sm
      LEFT JOIN last_snapshot ls
        ON ls.item_id = sm.item_id AND ls.store_id = sm.store_id
      WHERE sm.is_deleted = false
        AND sm.store_id IS NOT NULL
        AND sm.transaction_date > COALESCE(ls.snapshot_date, '1900-01-01')
        AND sm.transaction_date <= CURRENT_DATE - INTERVAL '1 day'
      GROUP BY sm.item_id, sm.store_id
    )
    INSERT INTO ${stockBalanceSnapshots} (item_id, store_id, snapshot_date, closing_balance)
    SELECT
      d.item_id,
      d.store_id,
      CURRENT_DATE - INTERVAL '1 day',
      COALESCE(ls.closing_balance, 0) + d.net_change
    FROM deltas d
    LEFT JOIN last_snapshot ls ON ls.item_id = d.item_id AND ls.store_id = d.store_id
    ON CONFLICT (item_id, store_id, snapshot_date)
    DO UPDATE SET closing_balance = EXCLUDED.closing_balance
  `);

  revalidateTag('stock-balance', 'max');

  return NextResponse.json({ snapshotsWritten: result.rowCount });
}
