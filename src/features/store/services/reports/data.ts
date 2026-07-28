"use cache";

import { and, asc, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";

import type {
  StockMovementReportFormValues,
  StockMovementReportRow,
} from "@/features/store/utils/store.types";

import db from "@/drizzle/db";
import { products, stockMovements } from "@/drizzle/schema";
import { signedQtySum } from "@/features/store/services/stock-balance/sign-convention";
import { sqlInList } from "@/features/store/services/stock-balance/utils";
import { stockMovementReportSchema } from "@/features/store/utils/schema";
import { validateFields } from "@/lib/action-validator";

export const getStockMovementReport = async (values: unknown) => {
  const { data, error } = validateFields<StockMovementReportFormValues>(
    values,
    stockMovementReportSchema,
  );
  if (error !== null) {
    return {
      error:
        "Invalid report parameters set. Ensure you have set valid report params",
      data: null,
      pageCount: 0,
    };
  }

  cacheTag("stock-balance");

  const { storeId, from, to, page, pageSize, sortDir, search } = data;
  const offset = (page - 1) * pageSize;

  const pageItems = await db
    .select({
      itemId: stockMovements.itemId,
      productName: products.productName,
      totalCount: sql<number>`COUNT(*) OVER()::int`,
    })
    .from(stockMovements)
    .innerJoin(products, eq(products.id, stockMovements.itemId))
    .where(
      and(
        eq(stockMovements.storeId, storeId),
        eq(stockMovements.isDeleted, false),
        gte(stockMovements.transactionDate, from),
        lte(stockMovements.transactionDate, to),
        eq(products.stockItem, true),
        search ? ilike(products.productName, `%${search}%`) : undefined,
      ),
    )
    .groupBy(stockMovements.itemId, products.productName)
    .orderBy(
      sortDir === "desc"
        ? desc(products.productName)
        : asc(products.productName),
    )
    .limit(pageSize)
    .offset(offset);

  if (pageItems.length === 0) {
    return {
      error: null,
      data: [] as Array<StockMovementReportRow>,
      pageCount: 0,
    };
  }

  const totalCount = pageItems[0].totalCount;
  const itemIds = pageItems.map((item) => item.itemId);

  const aggregates = await db.execute<{
    item_id: string;
    opening_balance: number;
    grn: number;
    issue: number;
    transfer_out: number;
    transfer_in: number;
    conversion_out: number;
    conversion_in: number;
    closing_balance: number;
  }>(sql`
    WITH nearest_snapshot AS (
      SELECT DISTINCT ON (item_id)
        item_id, snapshot_date, closing_balance
      FROM stock_balance_snapshots
      WHERE store_id = ${storeId}
        AND item_id IN ${sqlInList(itemIds)}
        AND snapshot_date < ${from}
      ORDER BY item_id, snapshot_date DESC
    ),
    opening_deltas AS (
      SELECT
        sm.item_id,
        ${signedQtySum({ transactionType: sql`sm.transaction_type`, qty: sql`sm.qty` })} AS delta
      FROM stock_movements sm
      LEFT JOIN nearest_snapshot ns ON ns.item_id = sm.item_id
      WHERE sm.store_id = ${storeId}
        AND sm.item_id IN ${sqlInList(itemIds)}
        AND sm.is_deleted = false
        AND sm.transaction_date < ${from}
        AND sm.transaction_date > COALESCE(ns.snapshot_date, DATE '1900-01-01')
      GROUP BY sm.item_id
    ),
    period AS (
      SELECT
        sm.item_id,
        SUM(sm.qty) FILTER (WHERE sm.transaction_type = 'GRN') AS grn,
        SUM(sm.qty) FILTER (WHERE sm.transaction_type = 'ISSUE') AS issue,
        SUM(sm.qty) FILTER (WHERE sm.transaction_type = 'TRANSFER') AS transfer_out,
        SUM(sm.qty) FILTER (WHERE sm.transaction_type = 'TRANSFER_IN') AS transfer_in,
        SUM(sm.qty) FILTER (WHERE sm.transaction_type = 'CONVERSION_OUT') AS conversion_out,
        SUM(sm.qty) FILTER (WHERE sm.transaction_type = 'CONVERSION_IN') AS conversion_in,
        SUM(sm.qty) FILTER (WHERE sm.transaction_type = 'OPENING_BAL') AS opening_bal_in_range
      FROM stock_movements sm
      WHERE sm.store_id = ${storeId}
        AND sm.item_id IN ${sqlInList(itemIds)}
        AND sm.is_deleted = false
        AND sm.transaction_date BETWEEN ${from} AND ${to}
      GROUP BY sm.item_id
    )
    SELECT
      p.item_id,
      (COALESCE(ns.closing_balance, 0) + COALESCE(od.delta, 0))::float8 AS opening_balance,
      COALESCE(p.grn, 0)::float8 AS grn,
      COALESCE(p.issue, 0)::float8 AS issue,
      COALESCE(p.transfer_out, 0)::float8 AS transfer_out,
      COALESCE(p.transfer_in, 0)::float8 AS transfer_in,
      COALESCE(p.conversion_out, 0)::float8 AS conversion_out,
      COALESCE(p.conversion_in, 0)::float8 AS conversion_in,
      (
        COALESCE(ns.closing_balance, 0) + COALESCE(od.delta, 0)
        + COALESCE(p.grn, 0) + COALESCE(p.transfer_in, 0)
        + COALESCE(p.conversion_in, 0) + COALESCE(p.opening_bal_in_range, 0)
        - COALESCE(p.issue, 0) - COALESCE(p.transfer_out, 0) - COALESCE(p.conversion_out, 0)
      )::float8 AS closing_balance
    FROM period p
    LEFT JOIN nearest_snapshot ns ON ns.item_id = p.item_id
    LEFT JOIN opening_deltas od ON od.item_id = p.item_id
  `);

  const aggregatesByItemId = new Map(
    aggregates.rows.map((row) => [row.item_id, row]),
  );

  const reportRows: Array<StockMovementReportRow> = pageItems.map((item) => {
    const aggregate = aggregatesByItemId.get(item.itemId);
    return {
      itemId: item.itemId,
      productName: item.productName,
      openingBalance: aggregate?.opening_balance ?? 0,
      grn: aggregate?.grn ?? 0,
      issue: aggregate?.issue ?? 0,
      transferOut: aggregate?.transfer_out ?? 0,
      transferIn: aggregate?.transfer_in ?? 0,
      conversionOut: aggregate?.conversion_out ?? 0,
      conversionIn: aggregate?.conversion_in ?? 0,
      closingBalance: aggregate?.closing_balance ?? 0,
    };
  });

  return {
    error: null,
    data: reportRows,
    pageCount: Math.ceil(totalCount / pageSize),
  };
};
