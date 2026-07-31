# Task: Refactor `getProductBalance` to use snapshot-based balance calculation

## Context

`getProductBalance` currently computes stock balance via a full-history `SUM` over `stock_movements` for every call. This is the same performance problem already solved for the stock movement report and the nightly Inngest snapshot job: both use `stock_balance_snapshots` (nearest snapshot ≤ target date) + a bounded delta sum of movements since that snapshot, instead of scanning full history.

This task brings `getProductBalance` in line with that existing approach — it should not be a third, independently-maintained implementation of the same balance logic.

## Requirement 1 — single source of truth for the sign convention

Before touching `getProductBalance`, locate the existing sign-convention logic in the nightly snapshot job and the stock movement report query (search the codebase for `MOVEMENT_IN`/`MOVEMENT_OUT` or the equivalent `CASE` statement over `transactionType`). Extract it into one shared module — a `MOVEMENT_IN`/`MOVEMENT_OUT` constant pair plus a `signedQtySum()` SQL helper — and update the snapshot job and report query to import from it, if they don't already. `getProductBalance` must use this same shared helper, not a locally re-declared copy.

Sign convention (must match exactly, this is already established elsewhere in the codebase):

- Inbound (+): `GRN`, `TRANSFER_IN`, `CONVERSION_IN`, `OPENING_BAL`
- Outbound (–): `ISSUE`, `TRANSFER`, `CONVERSION_OUT`
- `CONVERSION` (bare enum value): excluded/legacy, do not include

## Requirement 2 — refactor `getProductBalance`

Current implementation:

```ts
export const getProductBalance = async (
  productId: string,
  storeId: string,
  asOf: Date,
) => {
  cacheTag(
    "stock-balance",
    getProductStockBalanceTags(productId, storeId, asOf),
  );

  const movementIn = [
    "GRN",
    "TRANSFER_IN",
    "CONVERSION_IN",
    "OPENING_BAL",
  ] as const;
  const movementOut = ["ISSUE", "TRANSFER", "CONVERSION_OUT"] as const;
  const formattedDate = dateFormat(asOf);

  const result = await db
    .select({
      balance: sql<number>`
      COALESCE(
        SUM(
          CASE
            WHEN ${stockMovements.transactionType} IN ${sqlInList(movementIn)}
              THEN COALESCE(${stockMovements.qty},0)
            WHEN ${stockMovements.transactionType} IN ${sqlInList(movementOut)}
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
        lte(stockMovements.transactionDate, formattedDate),
        eq(stockMovements.isDeleted, false),
      ),
    )
    .then((d) => {
      const value = Number(d[0]?.balance);
      return Number.isFinite(value) ? value : 0;
    });

  return result;
};
```

Target approach (starting point — verify against the actual Drizzle/driver setup in this project, do not assume the derived-table syntax below is correct as-is; adapt to a CTE-based query builder call if the raw derived table doesn't compile cleanly):

```ts
export const getProductBalance = async (
  productId: string,
  storeId: string,
  asOf: Date,
) => {
  cacheTag(
    "stock-balance",
    getProductStockBalanceTags(productId, storeId, asOf),
  );

  const formattedDate = dateFormat(asOf);

  const result = await db
    .select({
      balance: sql<number>`COALESCE(t.balance, 0)::float`,
    })
    .from(
      sql`(
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
          ) AS balance
    ) as t`,
    )
    .then((d) => {
      const value = Number(d[0]?.balance);
      return Number.isFinite(value) ? value : 0;
    });

  return result;
};
```

Constraints:

- Function signature, the `cacheTag` call, and the `NaN`/finite-value fallback must stay exactly as-is — this is a performance refactor, not a behavior change.
- When no snapshot exists yet for a product/store (pre-backfill, or `asOf` predates the first snapshot), the query must gracefully degrade to a full-history sum (the `COALESCE(..., '1900-01-01')` handles this) — it must not throw or silently return 0.

## Requirement 3 — verification (required before removing the old implementation)

Write a temporary comparison script or test that runs **both** the old full-history implementation and the new snapshot+delta implementation for a representative set of cases, and asserts they return identical values:

- A product/store with existing snapshots and movements both before and after the snapshot date
- A product/store with **no** snapshots yet (tests the fallback path)
- An `asOf` date before any movements exist (expect 0)
- An `asOf` date that exactly equals a snapshot's `snapshot_date`
- An `asOf` date falling between two snapshots

Do not delete the old implementation until every case matches. This step also serves as the confirmation that the derived-table SQL actually executes correctly against this project's Postgres/Drizzle driver — if it fails to compile or run, fix the query shape here rather than deferring that discovery to production.

Once verification passes, remove the old full-history implementation and the temporary comparison script (don't leave dead code behind).

## Acceptance checklist

- [ ] Sign-convention logic consolidated into one shared module, used by the snapshot job, the report query, and `getProductBalance`
- [ ] `getProductBalance` returns identical results to the old implementation across all test cases, including both edge cases (no snapshot, boundary dates)
- [ ] Derived-table query confirmed executing against the project's actual DB/driver setup
- [ ] Function signature, `cacheTag` behavior, and NaN handling unchanged
- [ ] Temporary comparison script and old implementation removed after verification passes
