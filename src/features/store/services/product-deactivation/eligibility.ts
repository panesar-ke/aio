import { sql } from "drizzle-orm";

import db from "@/drizzle/db";
import {
  mrqDetails,
  mrqHeaders,
  ordersDetails,
  ordersHeader,
  productDeactivationItems,
  products,
  stockMovements,
} from "@/drizzle/schema";

export interface ProductUsageEligibilityInput {
  lastUsedDate: Date | null;
  createdOn: Date | null;
}

function isOlderThanThreshold(
  date: Date,
  thresholdDays: number,
  asOf: Date,
): boolean {
  const cutoff = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()),
  );
  cutoff.setUTCDate(cutoff.getUTCDate() - thresholdDays);
  const candidate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  return candidate.getTime() < cutoff.getTime();
}

export function isEligibleForDeactivation(
  usage: ProductUsageEligibilityInput,
  thresholdDays: number,
  asOf: Date,
): boolean {
  if (usage.lastUsedDate !== null) {
    return isOlderThanThreshold(usage.lastUsedDate, thresholdDays, asOf);
  }

  if (usage.createdOn === null) {
    return true;
  }

  return isOlderThanThreshold(usage.createdOn, thresholdDays, asOf);
}

export type LastUsedSource =
  | "stock_movements"
  | "mrq"
  | "orders"
  | "reactivated"
  | "never_referenced";

export interface ProductUsageAggregate {
  productId: string;
  createdOn: Date | null;
  lastUsedDate: Date | null;
  lastUsedSource: LastUsedSource;
}

export function buildProductUsageAggregatesQuery() {
  return sql`
    WITH stock_usage AS (
      SELECT sm.item_id AS product_id, MAX(sm.transaction_date) AS last_date
      FROM ${stockMovements} sm
      WHERE sm.is_deleted = false
      GROUP BY sm.item_id
    ),
    mrq_usage AS (
      SELECT md.item_id AS product_id, MAX(mh.document_date)::date AS last_date
      FROM ${mrqDetails} md
      INNER JOIN ${mrqHeaders} mh ON mh.id = md.header_id
      WHERE md.item_id IS NOT NULL
      GROUP BY md.item_id
    ),
    orders_usage AS (
      SELECT od.item_id AS product_id, MAX(oh.document_date)::date AS last_date
      FROM ${ordersDetails} od
      INNER JOIN ${ordersHeader} oh ON oh.id = od.header_id
      WHERE od.item_id IS NOT NULL
      GROUP BY od.item_id
    ),
    reactivation_usage AS (
      SELECT pdi.product_id AS product_id, MAX(pdi.reactivated_on AT TIME ZONE 'UTC')::date AS last_date
      FROM ${productDeactivationItems} pdi
      WHERE pdi.reactivated = true AND pdi.reactivated_on IS NOT NULL
      GROUP BY pdi.product_id
    )
    SELECT
      p.id AS product_id,
      p.created_on AS created_on,
      GREATEST(su.last_date, mu.last_date, ou.last_date, ru.last_date) AS last_used_date,
      CASE
        WHEN GREATEST(su.last_date, mu.last_date, ou.last_date, ru.last_date) IS NULL THEN 'never_referenced'
        WHEN GREATEST(su.last_date, mu.last_date, ou.last_date, ru.last_date) = su.last_date THEN 'stock_movements'
        WHEN GREATEST(su.last_date, mu.last_date, ou.last_date, ru.last_date) = mu.last_date THEN 'mrq'
        WHEN GREATEST(su.last_date, mu.last_date, ou.last_date, ru.last_date) = ou.last_date THEN 'orders'
        ELSE 'reactivated'
      END AS last_used_source
    FROM ${products} p
    LEFT JOIN stock_usage su ON su.product_id = p.id
    LEFT JOIN mrq_usage mu ON mu.product_id = p.id
    LEFT JOIN orders_usage ou ON ou.product_id = p.id
    LEFT JOIN reactivation_usage ru ON ru.product_id = p.id
    WHERE p.active = true
      AND p.stock_item = true
      AND p.exclude_from_auto_deactivation = false
  `;
}

type ProductUsageAggregateRow = {
  product_id: string;
  created_on: string | null;
  last_used_date: string | null;
  last_used_source: LastUsedSource;
};

export async function getProductUsageAggregates(): Promise<
  Array<ProductUsageAggregate>
> {
  const result = await db.execute<ProductUsageAggregateRow>(
    buildProductUsageAggregatesQuery(),
  );

  return result.rows.map((row) => ({
    productId: row.product_id,
    createdOn: row.created_on ? new Date(row.created_on) : null,
    lastUsedDate: row.last_used_date ? new Date(row.last_used_date) : null,
    lastUsedSource: row.last_used_source,
  }));
}

export async function getEligibleCandidates(
  thresholdDays: number,
  asOf: Date,
): Promise<Array<ProductUsageAggregate>> {
  const aggregates = await getProductUsageAggregates();

  return aggregates.filter((aggregate) =>
    isEligibleForDeactivation(aggregate, thresholdDays, asOf),
  );
}
