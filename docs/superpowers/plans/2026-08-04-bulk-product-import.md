# Bulk Product Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a Procurement/Store user download a blank `.xlsx` template for a chosen store + opening-balance date, upload it back, and have every row create a new (inactive, default-category/UOM) product plus an `OPENING_BAL` stock movement — processed in the background via Inngest, with a batch/audit trail, error-report download, and a completion email.

**Architecture:** Next.js Server Action does synchronous structural validation (file type/size, header match, row-count cap) and persists the raw file bytes (base64) on a new `product_import_batches` row, then fires an Inngest event. A single Inngest function does all row-level validation, bulk product + `OPENING_BAL` stock-movement creation, per-row audit writes to `product_import_batch_rows`, batch finalization, and a Resend completion email. The frontend is a two-column page (TanStack Form header + drag-and-drop upload on the left, static instructions on the right, polling "Recent Imports" `DataTable` below/beside) under `src/app/(protected)/procurement/products/import/`.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM/PostgreSQL, Inngest, ExcelJS (already installed), TanStack Form + Zod, TanStack Query (polling), TanStack Table (`DataTable`), Resend + `react-email`.

## Global Constraints

- Template columns, exactly in this order: `product_name` (required), `price` (optional → `buying_price`), `opening_qty` (required, ≥ 0). No `sku`/`uom`/`category` columns — confirmed by product decision, `products` has no `sku` column.
- Every row always creates a **new** product — no matching/merging against existing products by name (confirmed by product decision; ignore the mockup's "adds to balance" copy).
- Created product defaults (from named constants, not scattered literals): `categoryId = DEFAULT_IMPORT_CATEGORY_ID` (1, "Raw Material" — confirmed against dev DB), `uomId = DEFAULT_IMPORT_UOM_ID` (4, "Pieces" — confirmed against dev DB), `active = false`, `stockItem = true`, `isPeace = false` (this is the actual DB column backing the "Sub Item" flag — see Context below), `excludeFromAutoDeactivation = false`.
- `opening_qty` ≥ 0 always (qty is unsigned system-wide); `price` ≥ 0 when present, nullable otherwise.
- Max `MAX_IMPORT_ROWS = 5000` rows/file; only `.xlsx` accepted (`IMPORT_FILE_EXTENSION`), max `MAX_IMPORT_FILE_SIZE_BYTES` (10MB).
- `asOfDate` must not be in the future (confirmed by product decision); `storeId` + `asOfDate` required before Download Template / Upload are enabled.
- Access: reuse `requireAnyPermission(['procurement:admin','procurement:standard','store:admin','store:standard'])` on every mutating action/route — the same set `upsertProduct` already uses. The page itself stays ungated, matching every sibling `products/*` page today.
- Form state for the header (store + date) MUST use TanStack Form (`useAppForm` from `src/lib/form.tsx`), not react-hook-form — this repo's `products` feature is already 100% TanStack Form.
- `OPENING_BAL` movements: `qty` stored unsigned/positive (already classified as an "IN" movement in `sign-convention.ts`), and `invalidateStockBalanceSnapshots` MUST be called after inserting them, exactly like the GRN flow does — otherwise the nightly snapshot cron carries a stale balance forward.

## Context you need before starting (read once, don't re-derive)

- **`sku` does not exist** on `products` — omit entirely, don't add it.
- Real column names differ from naive guesses: the "Sub Item" boolean is `isPeace` (DB column `is_peace`, a pre-existing oddly-named column — not something to fix here), and "is stock item" is `stockItem` (DB column `stock_item`).
- **No existing "create OPENING_BAL movement" helper exists anywhere in the repo.** The manual product-creation form has a dead, never-persisted `openingBalance` field. Task 7 below writes fresh insert logic modeled on the GRN flow (`src/features/store/services/grns/actions.ts:114-125`) — insert into `stockMovements` + call `invalidateStockBalanceSnapshots`.
- **No blob/object storage exists in this repo** (no `@vercel/blob`, S3, uploadthing despite vestigial env vars). Rather than add a new dependency or risk Inngest's event-payload size limits with a 10MB file, this plan stores the uploaded file's bytes as **base64 in a new `file_data` text column** on `product_import_batches`, and the Inngest job reads it back by `batchId`. This is a deliberate, documented tradeoff — flag it in the final summary as a known limitation if file volume grows.
- The nightly `stock_balance_snapshot` job is a **Vercel Cron route**, not Inngest, with no manual-trigger event. Per the product's own scope doc, relying on that nightly cron to eventually reconcile snapshots is fine — this plan does not add a manual trigger.
- **"Get batch status" and "list recent batches" are consolidated into one endpoint** (`GET /api/procurement/products/import/batches`) — the Recent Imports table already needs the full list, and doc §7.3 ("get batch status") is satisfied by that same list since the client polls the whole table. Do not build a second per-batch status endpoint — that would be pure duplication.
- `stockMovements.transactionId` is `text NOT NULL`. GRN groups multiple line items under one shared `transactionId` (the GRN header id). Here there is no natural "header" per movement — each new product gets exactly one opening-balance movement — so this plan uses **the newly created product's id** as `transactionId`.
- Category/UOM ids are looked up as hardcoded constants (`1`/`4`, confirmed against the dev DB), **but the Inngest job verifies both rows still exist at job start** (`verify-defaults` step) and fails the batch with a clear message instead of silently letting a `category_id`/`uom_id` FK violation blow up mid-batch — this is safer than fuzzy name-matching, since the real category name in the DB is `"row material"` (a typo — matching against `"Raw Material"` by name would actually fail).
- `env.RESEND_FROM_EMAIL` may be undefined per its Zod schema (`.optional()`) — existing code (`src/lib/resend.ts`) uses `env.RESEND_FROM_EMAIL!`; follow that same existing (non-null-asserted) convention here, don't add new handling.

---

### Task 1: Constants + Zod schemas for the import feature

**Files:**
- Create: `src/features/procurement/services/products-import/constants.ts`
- Create: `src/features/procurement/utils/products-import/schemas.ts`
- Test: `src/features/procurement/utils/products-import/schemas.test.ts`

**Interfaces:**
- Produces: `MAX_IMPORT_ROWS`, `IMPORT_FILE_EXTENSION`, `IMPORT_FILE_MIME_TYPE`, `MAX_IMPORT_FILE_SIZE_BYTES`, `DEFAULT_IMPORT_CATEGORY_ID`, `DEFAULT_IMPORT_CATEGORY_LABEL`, `DEFAULT_IMPORT_UOM_ID`, `DEFAULT_IMPORT_UOM_LABEL`, `IMPORT_TEMPLATE_HEADERS` (readonly tuple), `PRODUCTS_IMPORT_EVENT` (all consumed by every later task).
- Produces: `productImportHeaderSchema`, `ProductImportHeaderValues`, `productImportRowSchema`, `ProductImportRowValues` (consumed by Tasks 6 and 7).

- [ ] **Step 1: Write the constants file**

```ts
// src/features/procurement/services/products-import/constants.ts
export const MAX_IMPORT_ROWS = 5000;

export const IMPORT_FILE_EXTENSION = '.xlsx';

export const IMPORT_FILE_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const DEFAULT_IMPORT_CATEGORY_ID = 1;
export const DEFAULT_IMPORT_CATEGORY_LABEL = 'Raw Material';

export const DEFAULT_IMPORT_UOM_ID = 4;
export const DEFAULT_IMPORT_UOM_LABEL = 'Pieces';

export const IMPORT_TEMPLATE_HEADERS = [
  'product_name',
  'price',
  'opening_qty',
] as const;

export const PRODUCTS_IMPORT_EVENT = 'products/import.requested' as const;
```

- [ ] **Step 2: Write the failing schema tests**

```ts
// src/features/procurement/utils/products-import/schemas.test.ts
import { describe, expect, it } from 'vitest';

import {
  productImportHeaderSchema,
  productImportRowSchema,
} from '@/features/procurement/utils/products-import/schemas';

describe('productImportHeaderSchema', () => {
  it('accepts a valid store + today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = productImportHeaderSchema.safeParse({
      storeId: 'store-1',
      asOfDate: today,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing storeId', () => {
    const result = productImportHeaderSchema.safeParse({
      storeId: '',
      asOfDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a future asOfDate', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const result = productImportHeaderSchema.safeParse({
      storeId: 'store-1',
      asOfDate: future.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Opening balance date cannot be in the future.',
      );
    }
  });
});

describe('productImportRowSchema', () => {
  it('accepts a valid row with no price', () => {
    const result = productImportRowSchema.safeParse({
      product_name: 'Bolt 10mm',
      price: null,
      opening_qty: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty product_name', () => {
    const result = productImportRowSchema.safeParse({
      product_name: '',
      price: null,
      opening_qty: 5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative opening_qty', () => {
    const result = productImportRowSchema.safeParse({
      product_name: 'Bolt 10mm',
      price: null,
      opening_qty: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative price', () => {
    const result = productImportRowSchema.safeParse({
      product_name: 'Bolt 10mm',
      price: -5,
      opening_qty: 1,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm vitest run src/features/procurement/utils/products-import/schemas.test.ts`
Expected: FAIL — `Cannot find module '@/features/procurement/utils/products-import/schemas'`

- [ ] **Step 4: Write the schema implementation**

```ts
// src/features/procurement/utils/products-import/schemas.ts
import { z } from 'zod';

import { requiredStringSchemaEntry } from '@/lib/schema-rules';

export const productImportHeaderSchema = z
  .object({
    storeId: requiredStringSchemaEntry('Select a store.'),
    asOfDate: z.string().date('Select a valid opening balance date.'),
  })
  .superRefine((data, ctx) => {
    if (!data.asOfDate) return;
    const asOfDate = new Date(data.asOfDate);
    const today = new Date();
    asOfDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (asOfDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Opening balance date cannot be in the future.',
        path: ['asOfDate'],
      });
    }
  });

export type ProductImportHeaderValues = z.infer<typeof productImportHeaderSchema>;

export const productImportRowSchema = z.object({
  product_name: z.string().trim().min(1, 'Product name is required.'),
  price: z
    .number()
    .nullable()
    .refine((value) => value === null || (Number.isFinite(value) && value >= 0), {
      message: 'Price must be a non-negative number.',
    }),
  opening_qty: z
    .number()
    .refine((value) => Number.isFinite(value) && value >= 0, {
      message: 'Opening quantity must be a non-negative number.',
    }),
});

export type ProductImportRowValues = z.infer<typeof productImportRowSchema>;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run src/features/procurement/utils/products-import/schemas.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add src/features/procurement/services/products-import/constants.ts \
        src/features/procurement/utils/products-import/schemas.ts \
        src/features/procurement/utils/products-import/schemas.test.ts
git commit -m "add product import constants and validation schemas"
```

---

### Task 2: Database schema + migration

**Files:**
- Modify: `src/drizzle/schemas/procurement.ts`
- Modify: `src/features/procurement/utils/procurement.types.ts` (add `'product-import-batches'` to `ProcurementCacheTag`)
- Create: (generated) `src/drizzle/migrations/00XX_<name>.sql`

**Interfaces:**
- Produces: `productImportBatchStatusEnum`, `productImportRowStatusEnum`, `productImportBatches`, `productImportBatchRows` Drizzle tables (re-exported via `src/drizzle/schema.ts`'s `export *`), consumed by Tasks 3, 6, 7, 8, 9.

- [ ] **Step 1: Read the current `procurement.ts` to confirm it still only contains `autoOrdersItems`/`autoOrderRelations`**

Run: `cat src/drizzle/schemas/procurement.ts`

- [ ] **Step 2: Append the new enums, tables, and relations**

```ts
// src/drizzle/schemas/procurement.ts — append after existing content
import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { products, stores, users } from '@/drizzle/schema';

export const productImportBatchStatusEnum = pgEnum('product_import_batch_status', [
  'queued',
  'processing',
  'completed',
  'completed_with_errors',
  'failed',
]);

export const productImportRowStatusEnum = pgEnum('product_import_row_status', [
  'success',
  'error',
]);

export const productImportBatches = pgTable(
  'product_import_batches',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .references(() => stores.id)
      .notNull(),
    asOfDate: text('as_of_date').notNull(),
    uploadedBy: uuid('uploaded_by')
      .references(() => users.id)
      .notNull(),
    fileName: text('file_name').notNull(),
    fileData: text('file_data').notNull(),
    status: productImportBatchStatusEnum('status').notNull().default('queued'),
    totalRows: integer('total_rows').notNull().default(0),
    successRows: integer('success_rows').notNull().default(0),
    failedRows: integer('failed_rows').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('product_import_batches_store_idx').on(table.storeId),
    index('product_import_batches_status_idx').on(table.status),
  ],
);

export const productImportBatchesRelations = relations(
  productImportBatches,
  ({ one, many }) => ({
    store: one(stores, {
      fields: [productImportBatches.storeId],
      references: [stores.id],
    }),
    uploadedByUser: one(users, {
      fields: [productImportBatches.uploadedBy],
      references: [users.id],
    }),
    rows: many(productImportBatchRows),
  }),
);

export const productImportBatchRows = pgTable(
  'product_import_batch_rows',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    batchId: uuid('batch_id')
      .references(() => productImportBatches.id)
      .notNull(),
    rowNumber: integer('row_number').notNull(),
    rawData: jsonb('raw_data').notNull(),
    status: productImportRowStatusEnum('status').notNull(),
    errorMessage: text('error_message'),
    productId: uuid('product_id').references(() => products.id),
  },
  (table) => [index('product_import_batch_rows_batch_idx').on(table.batchId)],
);

export const productImportBatchRowsRelations = relations(
  productImportBatchRows,
  ({ one }) => ({
    batch: one(productImportBatches, {
      fields: [productImportBatchRows.batchId],
      references: [productImportBatches.id],
    }),
    product: one(products, {
      fields: [productImportBatchRows.productId],
      references: [products.id],
    }),
  }),
);
```

Note: `asOfDate` is stored as `text` (not Drizzle's `date` type) deliberately — it's written once from the already-validated `yyyy-MM-dd` string coming out of `productImportHeaderSchema` and read back verbatim as `transactionDate` for the stock movement insert (Task 7); no date arithmetic happens on this column in SQL, so `text` avoids any timezone-shift surprises `date` columns can introduce through the driver. This mirrors how `GrnFormValues.receiptDate` is formatted client-side (`dateFormat`) before being handed to `stockMovements.transactionDate`, which is itself `date` — the source of truth for a clean string is the app layer either way.

- [ ] **Step 3: Add the new cache tag to the `ProcurementCacheTag` union**

In `src/features/procurement/utils/procurement.types.ts`, add `'product-import-batches'` to the existing union (around line 152-165):

```ts
export type ProcurementCacheTag =
  | 'material-requisitions'
  | 'material-requisition-no'
  | 'purchase-orders'
  | 'categories'
  | 'uoms'
  | 'products'
  | 'services'
  | 'projects'
  | 'vendors'
  | 'vendors_stats'
  | 'purchase-order-no'
  | 'auto-orders'
  | 'pending-requests'
  | 'product-import-batches';
```

- [ ] **Step 4: Generate the migration**

Run: `pnpm db:generate`
Expected: a new file `src/drizzle/migrations/00XX_<generated-name>.sql` containing `CREATE TYPE`, two `CREATE TABLE` statements, and FK `ALTER TABLE` constraints, separated by `--> statement-breakpoint` (mirror the style already in `0030_blue_major_mapleleaf.sql`).

- [ ] **Step 5: Review the generated SQL**

Run: `cat src/drizzle/migrations/00XX_*.sql`
Confirm: two new pgEnums, two new tables with the exact columns above, three FK constraints (`store_id`→`stores.id`, `uploaded_by`→`users.id`, `batch_id`→`product_import_batches.id`, `product_id`→`products.id` — four total). No unrelated changes leaked in from schema drift.

- [ ] **Step 6: Apply the migration**

Run: `pnpm db:migrate`
Expected: migration applies cleanly against the local dev DB with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/drizzle/schemas/procurement.ts \
        src/features/procurement/utils/procurement.types.ts \
        src/drizzle/migrations/
git commit -m "add product_import_batches and product_import_batch_rows tables"
```

---

### Task 3: Cache tags + data layer

**Files:**
- Modify: `src/features/procurement/utils/cache.ts`
- Create: `src/features/procurement/services/products-import/data.ts`

**Interfaces:**
- Consumes: `productImportBatches`, `productImportBatchRows` from Task 2.
- Produces: `getProductImportBatchesGlobalTag()`, `getProductImportBatchIdTag(id)`, `revalidateProductImportBatches(id?)` (consumed by Tasks 6, 7, 9). `getRecentImportBatches(limit?)`, `getImportBatch(batchId)`, `getImportBatchErrorRows(batchId)` (consumed by Tasks 7, 9).

- [ ] **Step 1: Add cache tag helpers**

Append to `src/features/procurement/utils/cache.ts`:

```ts
export function getProductImportBatchesGlobalTag() {
  return getGlobalTag('product-import-batches');
}

export function getProductImportBatchIdTag(id: string) {
  return getIdTag('product-import-batches', id);
}

export function revalidateProductImportBatches(id?: string) {
  if (id) {
    revalidateTag(getProductImportBatchIdTag(id), 'max');
  }
  revalidateTag(getProductImportBatchesGlobalTag(), 'max');
}
```

- [ ] **Step 2: Write the data-layer functions**

```ts
// src/features/procurement/services/products-import/data.ts
'use cache';

import { and, desc, eq } from 'drizzle-orm';
import { cacheTag } from 'next/cache';

import db from '@/drizzle/db';
import {
  productImportBatchRows,
  productImportBatches,
  stores,
  users,
} from '@/drizzle/schema';
import {
  getProductImportBatchesGlobalTag,
  getProductImportBatchIdTag,
} from '@/features/procurement/utils/cache';

export const getRecentImportBatches = async (limit = 20) => {
  cacheTag(getProductImportBatchesGlobalTag());
  return db
    .select({
      id: productImportBatches.id,
      fileName: productImportBatches.fileName,
      storeName: stores.storeName,
      asOfDate: productImportBatches.asOfDate,
      status: productImportBatches.status,
      totalRows: productImportBatches.totalRows,
      successRows: productImportBatches.successRows,
      failedRows: productImportBatches.failedRows,
      uploadedByName: users.name,
      createdAt: productImportBatches.createdAt,
    })
    .from(productImportBatches)
    .innerJoin(stores, eq(productImportBatches.storeId, stores.id))
    .innerJoin(users, eq(productImportBatches.uploadedBy, users.id))
    .orderBy(desc(productImportBatches.createdAt))
    .limit(limit);
};

export const getImportBatch = async (batchId: string) => {
  cacheTag(getProductImportBatchIdTag(batchId));
  return db.query.productImportBatches.findFirst({
    where: (model, { eq }) => eq(model.id, batchId),
  });
};

export const getImportBatchErrorRows = async (batchId: string) => {
  cacheTag(getProductImportBatchIdTag(batchId));
  return db
    .select()
    .from(productImportBatchRows)
    .where(
      and(
        eq(productImportBatchRows.batchId, batchId),
        eq(productImportBatchRows.status, 'error'),
      ),
    )
    .orderBy(productImportBatchRows.rowNumber);
};
```

- [ ] **Step 3: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no new errors from these two files.

- [ ] **Step 4: Commit**

```bash
git add src/features/procurement/utils/cache.ts \
        src/features/procurement/services/products-import/data.ts
git commit -m "add product import cache tags and data layer"
```

---

### Task 4: Template download route handler

**Files:**
- Create: `src/app/api/procurement/products/import/template/route.ts`

**Interfaces:**
- Consumes: `IMPORT_TEMPLATE_HEADERS` from Task 1.

- [ ] **Step 1: Write the route handler**

```ts
// src/app/api/procurement/products/import/template/route.ts
import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

import { IMPORT_TEMPLATE_HEADERS } from '@/features/procurement/services/products-import/constants';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET() {
  try {
    await requireAnyPermission(
      ['procurement:admin', 'procurement:standard', 'store:admin', 'store:standard'],
      { mode: 'api' },
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    const headerRow = worksheet.addRow([...IMPORT_TEMPLATE_HEADERS]);
    headerRow.font = { bold: true };
    worksheet.addRow(['Example Product', 150, 25]);

    worksheet.getColumn(1).width = 32;
    worksheet.getColumn(2).width = 14;
    worksheet.getColumn(3).width = 14;

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename="products_import_template.xlsx"',
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json(
      { message: 'Failed to generate template' },
      { status: 500 },
    );
  }
}
```

Note: the `storeId` query param mentioned in the doc (§7.1, §9) is read and discarded client-side only for forward-compatibility (the template's content doesn't vary by store today) — no server-side handling needed since nothing here branches on it.

- [ ] **Step 2: Manual verification**

Run: `pnpm dev`, then visit `http://localhost:3000/api/procurement/products/import/template` while logged in as a procurement/store user.
Expected: downloads `products_import_template.xlsx` with a bold header row (`product_name`, `price`, `opening_qty`) and one example row (`Example Product`, `150`, `25`). Open it in Excel/LibreOffice to confirm.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/procurement/products/import/template/route.ts
git commit -m "add product import template download route"
```

---

### Task 5: Completion email template + Resend sender

**Files:**
- Create: `src/emails/product-import-completed.tsx`
- Modify: `src/lib/resend.ts`

**Interfaces:**
- Produces: `sendProductImportCompletedEmail(params)` (consumed by Task 7).

- [ ] **Step 1: Write the email component**

```tsx
// src/emails/product-import-completed.tsx
import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Tailwind,
  Text,
} from "react-email";

type ProductImportStatus = "completed" | "completed_with_errors" | "failed";

type Props = {
  fileName: string;
  status: ProductImportStatus;
  successRows: number;
  failedRows: number;
};

const STATUS_LABEL: Record<ProductImportStatus, string> = {
  completed: "completed successfully",
  completed_with_errors: "completed with some errors",
  failed: "failed",
};

export function ProductImportCompletedEmail({
  fileName,
  status,
  successRows,
  failedRows,
}: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white max-w-150 mx-auto rounded-xl overflow-hidden">
            <Section className="bg-gray-800 px-8 py-6">
              <Heading className="text-white text-[20px] font-bold m-0 text-center">
                Product Import {STATUS_LABEL[status]}
              </Heading>
            </Section>

            <Section className="px-8 py-8">
              <Text className="text-[16px] text-gray-700 mb-2">
                File: <strong>{fileName}</strong>
              </Text>
              <Text className="text-[16px] text-gray-700 mb-2">
                Products created: <strong>{successRows}</strong>
              </Text>
              <Text className="text-[16px] text-gray-700 mb-2">
                Rows failed: <strong>{failedRows}</strong>
              </Text>
              {failedRows > 0 && (
                <Text className="text-[14px] text-gray-500 mt-4">
                  Download the error report from the Recent Imports table to
                  see which rows need fixing, then re-upload just those rows.
                </Text>
              )}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
```

- [ ] **Step 2: Add the sender function**

Append to `src/lib/resend.ts`:

```ts
import { ProductImportCompletedEmail } from '@/emails/product-import-completed';

type SendProductImportCompletedEmailParams = {
  to: string;
  idempotencyKey: string;
  fileName: string;
  status: 'completed' | 'completed_with_errors' | 'failed';
  successRows: number;
  failedRows: number;
};

export async function sendProductImportCompletedEmail(
  params: SendProductImportCompletedEmailParams,
) {
  return resend.emails.send(
    {
      from: env.RESEND_FROM_EMAIL!,
      to: params.to,
      subject: `Product import ${params.status === 'failed' ? 'failed' : 'complete'}: ${params.fileName}`,
      react: jsx(ProductImportCompletedEmail, {
        fileName: params.fileName,
        status: params.status,
        successRows: params.successRows,
        failedRows: params.failedRows,
      }),
    },
    { idempotencyKey: params.idempotencyKey },
  );
}
```

(Add the new `import { ProductImportCompletedEmail } from '@/emails/product-import-completed';` to the top import block alongside the existing `SubscriptionExpirationReminder` import.)

- [ ] **Step 3: Typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/emails/product-import-completed.tsx src/lib/resend.ts
git commit -m "add product import completion email"
```

---

### Task 6: Upload + queue server action

**Files:**
- Create: `src/features/procurement/services/products-import/actions.ts`
- Test: `src/features/procurement/services/products-import/actions.test.ts`

**Interfaces:**
- Consumes: `productImportHeaderSchema` (Task 1), `MAX_IMPORT_ROWS`/`IMPORT_FILE_EXTENSION`/`MAX_IMPORT_FILE_SIZE_BYTES`/`IMPORT_TEMPLATE_HEADERS`/`PRODUCTS_IMPORT_EVENT` (Task 1), `revalidateProductImportBatches` (Task 3), `productImportBatches` (Task 2), `inngest` (`src/inngest/client.ts` — event type added in Task 7).
- Produces: `queueProductImport(formData: FormData): Promise<ActionResult<{ batchId: string }>>`, and the pure exported helpers `headersMatchTemplate(headers: Array<string>): boolean` / `readWorksheetHeaders(worksheet): Array<string>` (independently tested, consumed only within this file).

- [ ] **Step 1: Write the failing tests for the pure header-matching helper**

```ts
// src/features/procurement/services/products-import/actions.test.ts
import { describe, expect, it, vi } from 'vitest';

// Same pattern used in src/features/store/services/product-deactivation/actions.test.ts —
// mock session/permissions so importing this file doesn't pull in `server-only` guards.
vi.mock('@/lib/session', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/permissions/guards', () => ({ requireAnyPermission: vi.fn() }));

import { headersMatchTemplate } from '@/features/procurement/services/products-import/actions';

describe('headersMatchTemplate', () => {
  it('accepts the exact template headers', () => {
    expect(headersMatchTemplate(['product_name', 'price', 'opening_qty'])).toBe(true);
  });

  it('rejects reordered headers', () => {
    expect(headersMatchTemplate(['price', 'product_name', 'opening_qty'])).toBe(false);
  });

  it('rejects a missing column', () => {
    expect(headersMatchTemplate(['product_name', 'opening_qty'])).toBe(false);
  });

  it('is case-insensitive on the incoming header text', () => {
    expect(headersMatchTemplate(['Product_Name', 'Price', 'Opening_Qty'])).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/features/procurement/services/products-import/actions.test.ts`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Write the server action**

```ts
// src/features/procurement/services/products-import/actions.ts
'use server';

import ExcelJS from 'exceljs';

import db from '@/drizzle/db';
import { productImportBatches } from '@/drizzle/schema';
import {
  IMPORT_FILE_EXTENSION,
  IMPORT_TEMPLATE_HEADERS,
  MAX_IMPORT_FILE_SIZE_BYTES,
  MAX_IMPORT_ROWS,
  PRODUCTS_IMPORT_EVENT,
} from '@/features/procurement/services/products-import/constants';
import { revalidateProductImportBatches } from '@/features/procurement/utils/cache';
import { productImportHeaderSchema } from '@/features/procurement/utils/products-import/schemas';
import { inngest } from '@/inngest/client';
import { parseOrFail, runAction } from '@/lib/actions/safe-action';
import { requireAnyPermission } from '@/lib/permissions/guards';
import { getCurrentUser } from '@/lib/session';

const IMPORT_ACTION_PERMISSIONS = [
  'procurement:admin',
  'procurement:standard',
  'store:admin',
  'store:standard',
] as const;

export function readWorksheetHeaders(worksheet: ExcelJS.Worksheet): Array<string> {
  const headerRow = worksheet.getRow(1);
  return IMPORT_TEMPLATE_HEADERS.map((_, index) =>
    String(headerRow.getCell(index + 1).value ?? '')
      .trim()
      .toLowerCase(),
  );
}

export function headersMatchTemplate(headers: Array<string>): boolean {
  return IMPORT_TEMPLATE_HEADERS.every((expected, index) => headers[index] === expected);
}

export const queueProductImport = async (formData: FormData) =>
  runAction('queueProductImport', async () => {
    await requireAnyPermission([...IMPORT_ACTION_PERMISSIONS]);

    const header = parseOrFail(productImportHeaderSchema, {
      storeId: formData.get('storeId'),
      asOfDate: formData.get('asOfDate'),
    });

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return { error: true, message: 'Please select a file to import.' };
    }

    if (!file.name.toLowerCase().endsWith(IMPORT_FILE_EXTENSION)) {
      return { error: true, message: 'Only .xlsx files are accepted.' };
    }

    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      return {
        error: true,
        message: `File exceeds the maximum size of ${MAX_IMPORT_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();

    try {
      await workbook.xlsx.load(arrayBuffer);
    } catch {
      return { error: true, message: 'The uploaded file is not a valid .xlsx workbook.' };
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { error: true, message: 'The uploaded file has no worksheet.' };
    }

    if (!headersMatchTemplate(readWorksheetHeaders(worksheet))) {
      return {
        error: true,
        message: `Headers must exactly match the template: ${IMPORT_TEMPLATE_HEADERS.join(', ')}.`,
      };
    }

    const rowCount = worksheet.rowCount - 1;
    if (rowCount <= 0) {
      return { error: true, message: 'The uploaded file has no data rows.' };
    }
    if (rowCount > MAX_IMPORT_ROWS) {
      return {
        error: true,
        message: `File contains ${rowCount} rows, exceeding the ${MAX_IMPORT_ROWS} row limit.`,
      };
    }

    const user = await getCurrentUser('action');
    const fileData = Buffer.from(arrayBuffer).toString('base64');

    const [{ id: batchId }] = await db
      .insert(productImportBatches)
      .values({
        storeId: header.storeId,
        asOfDate: header.asOfDate,
        uploadedBy: user.id,
        fileName: file.name,
        fileData,
        status: 'queued',
        totalRows: rowCount,
      })
      .returning({ id: productImportBatches.id });

    await inngest.send({ name: PRODUCTS_IMPORT_EVENT, data: { batchId } });

    revalidateProductImportBatches(batchId);

    return {
      error: false,
      message: 'Import queued. You will be notified when it completes.',
      data: { batchId },
    };
  });
```

Note: `inngest.send({ name: PRODUCTS_IMPORT_EVENT, data: { batchId } })` will not typecheck against the `Events` map in `src/inngest/client.ts` until Task 7 adds the `"products/import.requested"` entry — that's expected; Task 7 must land before this file typechecks cleanly. If executing tasks strictly in order, run `pnpm tsc --noEmit` again after Task 7 rather than blocking here.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/features/procurement/services/products-import/actions.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/procurement/services/products-import/actions.ts \
        src/features/procurement/services/products-import/actions.test.ts
git commit -m "add product import upload and queue server action"
```

---

### Task 7: Inngest event registration + background job

**Files:**
- Modify: `src/inngest/client.ts`
- Create: `src/inngest/functions/products-import.ts`
- Modify: `src/app/api/inngest/route.ts`

**Interfaces:**
- Consumes: `PRODUCTS_IMPORT_EVENT`, `DEFAULT_IMPORT_CATEGORY_ID`, `DEFAULT_IMPORT_UOM_ID` (Task 1); `productImportRowSchema` (Task 1); `productImportBatches`, `productImportBatchRows` (Task 2); `revalidateProductImportBatches` (Task 3); `invalidateStockBalanceSnapshots` (`src/features/store/services/stock-balance/utils.ts`, existing); `sendProductImportCompletedEmail` (Task 5).
- Produces: registers the `process-product-import` Inngest function so Task 6's `inngest.send(...)` resolves to a real handler.

- [ ] **Step 1: Register the event type**

In `src/inngest/client.ts`, add to the `Events` map:

```ts
type Events = {
  "user/send.new.password": {
    data: {
      contact: string;
      password: string;
      name: string;
    };
  };
  "products/import.requested": {
    data: {
      batchId: string;
    };
  };
};
```

- [ ] **Step 2: Write the Inngest function**

```ts
// src/inngest/functions/products-import.ts
import { eq } from 'drizzle-orm';
import ExcelJS from 'exceljs';

import db from '@/drizzle/db';
import {
  productImportBatchRows,
  productImportBatches,
  products,
  stockMovements,
} from '@/drizzle/schema';
import {
  DEFAULT_IMPORT_CATEGORY_ID,
  DEFAULT_IMPORT_UOM_ID,
  PRODUCTS_IMPORT_EVENT,
} from '@/features/procurement/services/products-import/constants';
import { revalidateProductImportBatches } from '@/features/procurement/utils/cache';
import { productImportRowSchema } from '@/features/procurement/utils/products-import/schemas';
import { invalidateStockBalanceSnapshots } from '@/features/store/services/stock-balance/utils';
import { inngest } from '@/inngest/client';
import { sendProductImportCompletedEmail } from '@/lib/resend';

interface ParsedRow {
  rowNumber: number;
  rawData: { product_name: string; price: number | null; opening_qty: number | null };
  status: 'success' | 'error';
  errorMessage: string | null;
}

function parseCellNumber(value: ExcelJS.CellValue): number | null {
  if (value === null || value === undefined || value === '') return null;
  const raw =
    typeof value === 'object' && value !== null && 'result' in value
      ? (value as { result: unknown }).result
      : value;
  const num = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(num) ? num : Number.NaN;
}

export const processProductImport = inngest.createFunction(
  { id: 'process-product-import' },
  { event: PRODUCTS_IMPORT_EVENT },
  async ({ event, step }) => {
    const { batchId } = event.data;

    const batch = await step.run('load-batch', async () => {
      const record = await db.query.productImportBatches.findFirst({
        where: (model, { eq: eqOp }) => eqOp(model.id, batchId),
      });
      if (!record) throw new Error(`Import batch ${batchId} not found`);
      return record;
    });

    await step.run('mark-processing', async () => {
      await db
        .update(productImportBatches)
        .set({ status: 'processing', startedAt: new Date() })
        .where(eq(productImportBatches.id, batchId));
    });

    const defaultsExist = await step.run('verify-defaults', async () => {
      const [category, uom] = await Promise.all([
        db.query.productCategories.findFirst({
          where: (model, { eq: eqOp }) => eqOp(model.id, DEFAULT_IMPORT_CATEGORY_ID),
        }),
        db.query.uoms.findFirst({
          where: (model, { eq: eqOp }) => eqOp(model.id, DEFAULT_IMPORT_UOM_ID),
        }),
      ]);
      return Boolean(category) && Boolean(uom);
    });

    if (!defaultsExist) {
      await step.run('fail-missing-defaults', async () => {
        await db
          .update(productImportBatches)
          .set({ status: 'failed', completedAt: new Date(), failedRows: batch.totalRows })
          .where(eq(productImportBatches.id, batchId));
        revalidateProductImportBatches(batchId);
      });
      return { batchId, status: 'failed' as const };
    }

    const parsedRows = await step.run('parse-and-validate-rows', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(batch.fileData, 'base64'));
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return [];

      const results: Array<ParsedRow> = [];
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const productNameValue = row.getCell(1).value;
        const priceValue = row.getCell(2).value;
        const qtyValue = row.getCell(3).value;

        const isBlankRow =
          (productNameValue === null || productNameValue === undefined) &&
          (priceValue === null || priceValue === undefined) &&
          (qtyValue === null || qtyValue === undefined);
        if (isBlankRow) continue;

        const rawData = {
          product_name: String(productNameValue ?? '').trim(),
          price: parseCellNumber(priceValue),
          opening_qty: parseCellNumber(qtyValue),
        };

        const parsed = productImportRowSchema.safeParse(rawData);
        results.push({
          rowNumber,
          rawData,
          status: parsed.success ? 'success' : 'error',
          errorMessage: parsed.success ? null : (parsed.error.issues[0]?.message ?? 'Invalid row.'),
        });
      }
      return results;
    });

    const insertResult = await step.run('insert-products-and-movements', async () => {
      const validRows = parsedRows.filter((row) => row.status === 'success');
      const createdProductIdsByRow = new Map<number, string>();

      await db.transaction(async (tx) => {
        for (const row of validRows) {
          const [{ id: productId }] = await tx
            .insert(products)
            .values({
              productName: row.rawData.product_name,
              categoryId: DEFAULT_IMPORT_CATEGORY_ID,
              uomId: DEFAULT_IMPORT_UOM_ID,
              buyingPrice: row.rawData.price !== null ? row.rawData.price.toString() : null,
              active: false,
              stockItem: true,
              isPeace: false,
              excludeFromAutoDeactivation: false,
            })
            .returning({ id: products.id });

          createdProductIdsByRow.set(row.rowNumber, productId);
        }

        if (createdProductIdsByRow.size > 0) {
          const movements = validRows.map((row) => {
            const productId = createdProductIdsByRow.get(row.rowNumber);
            if (!productId) throw new Error(`Missing created product for row ${row.rowNumber}`);
            return {
              transactionDate: batch.asOfDate,
              itemId: productId,
              qty: String(row.rawData.opening_qty ?? 0),
              transactionType: 'OPENING_BAL' as const,
              transactionId: productId,
              createdBy: batch.uploadedBy,
              storeId: batch.storeId,
            };
          });

          await tx.insert(stockMovements).values(movements);
          await invalidateStockBalanceSnapshots(tx, movements);
        }

        if (parsedRows.length > 0) {
          await tx.insert(productImportBatchRows).values(
            parsedRows.map((row) => ({
              batchId,
              rowNumber: row.rowNumber,
              rawData: row.rawData,
              status: row.status,
              errorMessage: row.errorMessage,
              productId: createdProductIdsByRow.get(row.rowNumber) ?? null,
            })),
          );
        }
      });

      return {
        successCount: createdProductIdsByRow.size,
        failedCount: parsedRows.length - createdProductIdsByRow.size,
      };
    });

    const finalStatus = await step.run('finalize-batch', async () => {
      const { successCount, failedCount } = insertResult;
      const status =
        successCount === 0
          ? ('failed' as const)
          : failedCount === 0
            ? ('completed' as const)
            : ('completed_with_errors' as const);

      await db
        .update(productImportBatches)
        .set({
          status,
          successRows: successCount,
          failedRows: failedCount,
          completedAt: new Date(),
        })
        .where(eq(productImportBatches.id, batchId));

      revalidateProductImportBatches(batchId);
      return status;
    });

    await step.run('send-completion-email', async () => {
      const uploader = await db.query.users.findFirst({
        where: (model, { eq: eqOp }) => eqOp(model.id, batch.uploadedBy),
      });
      if (!uploader?.email) return;

      await sendProductImportCompletedEmail({
        to: uploader.email,
        idempotencyKey: `product-import-${batchId}`,
        fileName: batch.fileName,
        status: finalStatus,
        successRows: insertResult.successCount,
        failedRows: insertResult.failedCount,
      });
    });

    return { batchId, status: finalStatus };
  },
);
```

- [ ] **Step 3: Register the function**

```ts
// src/app/api/inngest/route.ts
import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { processProductImport } from "@/inngest/functions/products-import";
import { sendUserNewPassword } from "@/inngest/functions/users";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendUserNewPassword, processProductImport],
});
```

- [ ] **Step 4: Typecheck the whole feature so far**

Run: `pnpm tsc --noEmit`
Expected: no errors — this also resolves Task 6's `inngest.send(...)` typing against the now-registered event.

- [ ] **Step 5: Manual verification against the local Inngest dev server**

Run: `pnpm inngest` (in one terminal) and `pnpm dev` (in another). Use the Server Action from Task 6 (or a temporary script) to insert a `product_import_batches` row and call `inngest.send(...)` directly, or wait for Task 10's UI. Confirm in the Inngest dev UI (`http://localhost:8288`) that `process-product-import` runs all six steps and the batch's `status` ends at `completed`, with new rows visible in `products` and `stock_movements` (`transaction_type = 'OPENING_BAL'`).

- [ ] **Step 6: Commit**

```bash
git add src/inngest/client.ts src/inngest/functions/products-import.ts src/app/api/inngest/route.ts
git commit -m "add product import background job"
```

---

### Task 8: Error report download route handler

**Files:**
- Create: `src/app/api/procurement/products/import/[batchId]/errors/route.ts`

**Interfaces:**
- Consumes: `getImportBatchErrorRows`, `getImportBatch` (Task 3).

- [ ] **Step 1: Write the route handler**

```ts
// src/app/api/procurement/products/import/[batchId]/errors/route.ts
import ExcelJS from 'exceljs';
import { type NextRequest, NextResponse } from 'next/server';

import {
  getImportBatch,
  getImportBatchErrorRows,
} from '@/features/procurement/services/products-import/data';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    await requireAnyPermission(
      ['procurement:admin', 'procurement:standard', 'store:admin', 'store:standard'],
      { mode: 'api' },
    );

    const { batchId } = await params;
    const batch = await getImportBatch(batchId);
    if (!batch) {
      return NextResponse.json({ message: 'Import batch not found' }, { status: 404 });
    }

    const errorRows = await getImportBatchErrorRows(batchId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Errors');
    worksheet.addRow(['row_number', 'product_name', 'price', 'opening_qty', 'error']).font = {
      bold: true,
    };

    for (const row of errorRows) {
      const rawData = row.rawData as {
        product_name: string;
        price: number | null;
        opening_qty: number | null;
      };
      worksheet.addRow([
        row.rowNumber,
        rawData.product_name,
        rawData.price,
        rawData.opening_qty,
        row.errorMessage,
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${batch.fileName.replace(/\.xlsx$/i, '')}-errors.xlsx"`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Failed to generate error report' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Manual verification**

After Task 7's manual test produced a batch with some failing rows (or craft an upload that includes a bad row), visit `/api/procurement/products/import/<batchId>/errors` and confirm the downloaded `.xlsx` contains only the error rows with their messages.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/procurement/products/import/[batchId]/errors/route.ts
git commit -m "add product import error report download route"
```

---

### Task 9: Batches list route handler (polling) + polling hook

**Files:**
- Create: `src/app/api/procurement/products/import/batches/route.ts`
- Create: `src/features/procurement/hooks/use-import-batches.ts`

**Interfaces:**
- Consumes: `getRecentImportBatches` (Task 3).
- Produces: `useImportBatches(initialData)` hook, `ImportBatchListItem` type (consumed by Task 12).

- [ ] **Step 1: Write the list route handler**

```ts
// src/app/api/procurement/products/import/batches/route.ts
import { NextResponse } from 'next/server';

import { getRecentImportBatches } from '@/features/procurement/services/products-import/data';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET() {
  try {
    await requireAnyPermission(
      ['procurement:admin', 'procurement:standard', 'store:admin', 'store:standard'],
      { mode: 'api' },
    );

    const batches = await getRecentImportBatches();
    return NextResponse.json({ batches });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Failed to load import batches' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write the polling hook**

```ts
// src/features/procurement/hooks/use-import-batches.ts
"use client";

import { useQuery } from "@tanstack/react-query";

export interface ImportBatchListItem {
  id: string;
  fileName: string;
  storeName: string;
  asOfDate: string;
  status: "queued" | "processing" | "completed" | "completed_with_errors" | "failed";
  totalRows: number;
  successRows: number;
  failedRows: number;
  uploadedByName: string;
  createdAt: string;
}

interface ImportBatchesResponse {
  batches: Array<ImportBatchListItem>;
}

const ACTIVE_STATUSES = new Set(["queued", "processing"]);

export function useImportBatches(initialData: Array<ImportBatchListItem>) {
  return useQuery<ImportBatchesResponse>({
    queryKey: ["products-import", "batches"],
    queryFn: async () => {
      const res = await fetch("/api/procurement/products/import/batches");
      if (!res.ok) {
        throw new Error("Failed to fetch import batches");
      }
      return res.json();
    },
    initialData: { batches: initialData },
    refetchInterval: (query) => {
      const batches = query.state.data?.batches ?? [];
      const hasActive = batches.some((batch) => ACTIVE_STATUSES.has(batch.status));
      return hasActive ? 4000 : false;
    },
  });
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/procurement/products/import/batches/route.ts \
        src/features/procurement/hooks/use-import-batches.ts
git commit -m "add product import batches list route and polling hook"
```

---

### Task 10: Frontend — header form (store/date + download/upload/import)

**Files:**
- Create: `src/features/procurement/components/products-import/import-header-form.tsx`
- Create: `src/features/procurement/components/products-import/upload-dropzone.tsx`

**Interfaces:**
- Consumes: `productImportHeaderSchema` (Task 1), `queueProductImport` (Task 6), `useAppForm` (`src/lib/form.tsx`), `handleSubmitFeedback` (`src/lib/form-submit-feedback.tsx`), `Option` type (`src/types/index.types.ts`).
- Produces: `<ImportHeaderForm stores={Array<Option>} onQueued={(batchId: string) => void} />` (consumed by Task 13).

- [ ] **Step 1: Write the upload dropzone**

```tsx
// src/features/procurement/components/products-import/upload-dropzone.tsx
"use client";

import type { DragEvent } from "react";

import { UploadCloudIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IMPORT_FILE_EXTENSION } from "@/features/procurement/services/products-import/constants";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  disabled?: boolean;
  file: File | null;
  onFileSelected: (file: File) => void;
  onFileCleared: () => void;
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function UploadDropzone({
  disabled,
  file,
  onFileSelected,
  onFileCleared,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped?.name.toLowerCase().endsWith(IMPORT_FILE_EXTENSION)) {
      onFileSelected(dropped);
    }
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove selected file"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            onFileCleared();
          }}
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={disabled ? undefined : handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-colors",
        !disabled && "hover:border-primary/40 hover:bg-muted/60",
        disabled && "cursor-not-allowed opacity-50",
        isDragOver && "border-primary bg-muted",
      )}
    >
      <UploadCloudIcon className="size-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-foreground">Drag and drop your file here</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          or click to browse — {IMPORT_FILE_EXTENSION} files only
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={IMPORT_FILE_EXTENSION}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onFileSelected(selected);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write the header form**

```tsx
// src/features/procurement/components/products-import/import-header-form.tsx
"use client";

import { useSelector } from "@tanstack/react-store";
import { useState } from "react";
import toast from "react-hot-toast";

import type { Option } from "@/types/index.types";

import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { queueProductImport } from "@/features/procurement/services/products-import/actions";
import { productImportHeaderSchema } from "@/features/procurement/utils/products-import/schemas";
import { useAppForm } from "@/lib/form";
import { handleSubmitFeedback } from "@/lib/form-submit-feedback";

import { UploadDropzone } from "./upload-dropzone";

interface ImportHeaderFormProps {
  stores: Array<Option>;
  onQueued: () => void;
}

export function ImportHeaderForm({ stores, onQueued }: ImportHeaderFormProps) {
  const [file, setFile] = useState<File | null>(null);

  const form = useAppForm({
    defaultValues: { storeId: "", asOfDate: "" },
    validators: { onSubmit: productImportHeaderSchema },
    onSubmit: async ({ value }) => {
      if (!file) {
        toast.error("Please select a file to import.");
        return;
      }

      const formData = new FormData();
      formData.set("storeId", value.storeId);
      formData.set("asOfDate", value.asOfDate);
      formData.set("file", file);

      await handleSubmitFeedback({
        action: () => queueProductImport(formData),
        errorTitle: "Import failed to queue",
        successTitle: "Import queued",
        fallbackMessage: "Failed to queue the import. Please try again.",
        onSuccess: () => {
          setFile(null);
          onQueued();
        },
      });
    },
  });

  const [isSubmitting, storeId, asOfDate] = useSelector(form.store, (state) => [
    state.isSubmitting,
    state.values.storeId,
    state.values.asOfDate,
  ]);

  const isConfigured = Boolean(storeId && asOfDate);

  async function handleDownloadTemplate() {
    const response = await fetch(
      `/api/procurement/products/import/template?storeId=${storeId}`,
    );
    if (!response.ok) {
      toast.error("Failed to download template.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products_import_template.xlsx";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded. Fill it in, then upload it below.");
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <form.AppField name="storeId">
          {(field) => (
            <field.Select label="Store" placeholder="Select a store…">
              {stores.map((store) => (
                <SelectItem key={store.value} value={store.value}>
                  {store.label}
                </SelectItem>
              ))}
            </field.Select>
          )}
        </form.AppField>
        <form.AppField name="asOfDate">
          {(field) => <field.Input label="Opening Balance Date" type="date" />}
        </form.AppField>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-card-foreground">Download Template</p>
        <Button
          type="button"
          variant="outline"
          disabled={!isConfigured}
          onClick={handleDownloadTemplate}
        >
          Download Template
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-card-foreground">Upload Completed Template</p>
        <UploadDropzone
          disabled={!isConfigured}
          file={file}
          onFileSelected={setFile}
          onFileCleared={() => setFile(null)}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!isConfigured || !file || isSubmitting}>
            {isSubmitting ? "Validating…" : "Validate & Import"}
          </Button>
        </div>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: confirm `field.Select`/`field.Input` prop names match `src/components/form-components/select.tsx` and `textfield.tsx` exactly (mirror `products-form.tsx`'s usage) — adjust prop names if they differ from what's assumed here.

- [ ] **Step 4: Commit**

```bash
git add src/features/procurement/components/products-import/import-header-form.tsx \
        src/features/procurement/components/products-import/upload-dropzone.tsx
git commit -m "add product import header form and upload dropzone"
```

---

### Task 11: Frontend — instructions panel

**Files:**
- Create: `src/features/procurement/components/products-import/import-instructions-panel.tsx`

**Interfaces:**
- Consumes: `MAX_IMPORT_ROWS`, `IMPORT_FILE_EXTENSION`, `DEFAULT_IMPORT_CATEGORY_LABEL`, `DEFAULT_IMPORT_UOM_LABEL` (Task 1).

- [ ] **Step 1: Write the static instructions panel**

```tsx
// src/features/procurement/components/products-import/import-instructions-panel.tsx
import {
  DEFAULT_IMPORT_CATEGORY_LABEL,
  DEFAULT_IMPORT_UOM_LABEL,
  IMPORT_FILE_EXTENSION,
  MAX_IMPORT_ROWS,
} from "@/features/procurement/services/products-import/constants";

const STEPS = [
  "Choose the store and the opening balance date.",
  "Download the template.",
  "Fill in product_name, price (optional), and opening_qty for each new product.",
  "Upload the completed file — the system validates before saving anything.",
  "Review any errors, fix them in the file, and re-upload if needed.",
];

const COLUMNS = [
  { name: "product_name", note: "Required. Every row creates a brand-new product." },
  { name: "price", note: "Optional. Maps to the product's buying price." },
  { name: "opening_qty", note: "Required. Quantity on hand on the as-of date. Must be ≥ 0." },
];

const RULES = [
  "Do not modify the header row or column order.",
  `Every imported product is created with a default category ("${DEFAULT_IMPORT_CATEGORY_LABEL}") and unit of measure ("${DEFAULT_IMPORT_UOM_LABEL}") — correct these manually after import.`,
  "Imported products land inactive until reviewed and activated manually.",
  "opening_qty must be a positive number or zero — no negative values.",
  `Max ${MAX_IMPORT_ROWS.toLocaleString()} rows per upload. Split into multiple files for larger sets.`,
  `Accepted format: ${IMPORT_FILE_EXTENSION} only.`,
];

export function ImportInstructionsPanel() {
  return (
    <aside className="space-y-5">
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">How This Works</h2>
        </div>
        <ol className="divide-y">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3 px-5 py-3.5 text-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tertiary text-xs font-semibold text-tertiary-foreground">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">Template Column Guide</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 text-left">
              <th className="px-4 py-2.5 font-semibold">Column</th>
              <th className="px-4 py-2.5 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {COLUMNS.map((column) => (
              <tr key={column.name}>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono">{column.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{column.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">Rules &amp; Limits</h2>
        </div>
        <ul className="space-y-3 px-5 py-4 text-sm">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/features/procurement/components/products-import/import-instructions-panel.tsx
git commit -m "add product import instructions panel"
```

---

### Task 12: Frontend — Recent Imports table

**Files:**
- Create: `src/features/procurement/components/products-import/recent-imports-table.tsx`

**Interfaces:**
- Consumes: `useImportBatches`, `ImportBatchListItem` (Task 9), `DataTable`, `DataTableColumnHeader` (`src/components/custom/`), `CustomStatusBadge` (`src/components/custom/status-badges.tsx`).

- [ ] **Step 1: Write the table component**

```tsx
// src/features/procurement/components/products-import/recent-imports-table.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DownloadIcon } from "lucide-react";

import { DataTable } from "@/components/custom/datatable";
import { DataTableColumnHeader } from "@/components/custom/datatable-column-header";
import { CustomStatusBadge } from "@/components/custom/status-badges";
import { Button } from "@/components/ui/button";
import {
  type ImportBatchListItem,
  useImportBatches,
} from "@/features/procurement/hooks/use-import-batches";

const STATUS_VARIANT: Record<
  ImportBatchListItem["status"],
  "success" | "warning" | "error" | "info"
> = {
  queued: "info",
  processing: "warning",
  completed: "success",
  completed_with_errors: "warning",
  failed: "error",
};

const STATUS_LABEL: Record<ImportBatchListItem["status"], string> = {
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  completed_with_errors: "Completed with errors",
  failed: "Failed",
};

interface RecentImportsTableProps {
  initialData: Array<ImportBatchListItem>;
}

export function RecentImportsTable({ initialData }: RecentImportsTableProps) {
  const { data } = useImportBatches(initialData);
  const batches = data?.batches ?? initialData;

  const columns: Array<ColumnDef<ImportBatchListItem>> = [
    {
      accessorKey: "fileName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="File" />,
    },
    {
      accessorKey: "storeName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Store" />,
    },
    {
      accessorKey: "asOfDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="As-Of Date" />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <CustomStatusBadge
          variant={STATUS_VARIANT[row.original.status]}
          text={STATUS_LABEL[row.original.status]}
        />
      ),
    },
    {
      id: "rows",
      header: "Rows",
      cell: ({ row }) =>
        `${row.original.successRows}/${row.original.totalRows} ok, ${row.original.failedRows} failed`,
    },
    {
      accessorKey: "uploadedByName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded By" />,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded At" />,
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      id: "actions",
      cell: ({ row }) =>
        row.original.failedRows > 0 ? (
          <Button variant="ghost" size="sm" asChild>
            <a href={`/api/procurement/products/import/${row.original.id}/errors`} download>
              <DownloadIcon className="size-4" />
              Error report
            </a>
          </Button>
        ) : null,
    },
  ];

  return <DataTable data={batches} columns={columns} />;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/features/procurement/components/products-import/recent-imports-table.tsx
git commit -m "add product import recent imports table"
```

---

### Task 13: Frontend — page assembly

**Files:**
- Modify: `src/app/(protected)/procurement/products/import/page.tsx` (currently a no-op stub)

**Interfaces:**
- Consumes: `getStores` (`src/features/store/services/stores/data.ts`), `getRecentImportBatches` (Task 3), `ImportHeaderForm` (Task 10), `ImportInstructionsPanel` (Task 11), `RecentImportsTable` (Task 12).

- [ ] **Step 1: Write the page**

```tsx
// src/app/(protected)/procurement/products/import/page.tsx
import type { Metadata } from "next";

import { getStores } from "@/features/store/services/stores/data";
import { ImportHeaderFormWrapper } from "@/features/procurement/components/products-import/import-header-form-wrapper";
import { ImportInstructionsPanel } from "@/features/procurement/components/products-import/import-instructions-panel";
import { RecentImportsTable } from "@/features/procurement/components/products-import/recent-imports-table";
import { getRecentImportBatches } from "@/features/procurement/services/products-import/data";

export const metadata: Metadata = { title: "Product Import" };

export default async function ProductImportPage() {
  const [stores, rawBatches] = await Promise.all([getStores(), getRecentImportBatches()]);

  const storeOptions = stores.map((store) => ({
    value: store.id,
    label: store.storeName.toUpperCase(),
  }));

  // `createdAt` comes back as a real `Date` from Drizzle. React Server Component →
  // Client Component props preserve Date instances as-is (no JSON serialization), but
  // useImportBatches' polling path goes through `fetch().json()`, which turns it into
  // an ISO string. Normalize here so `ImportBatchListItem.createdAt` is always a string,
  // matching both the initial SSR data and every subsequent poll.
  const batches = rawBatches.map((batch) => ({
    ...batch,
    createdAt: batch.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bulk-load products and opening stock balances for a store using the standard Excel
          template.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ImportHeaderFormWrapper stores={storeOptions} />
        </div>
        <div className="lg:col-span-2">
          <ImportInstructionsPanel />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Imports</h2>
        <RecentImportsTable initialData={batches} />
      </div>
    </div>
  );
}
```

Since `revalidateProductImportBatches` triggers a full page/tag revalidation on queue+completion, and the `RecentImportsTable` needs to receive a fresh `batchId` reference after Task 10's `onQueued` callback fires, wrap the two left-column pieces in a small client component so `onQueued` can call `router.refresh()`:

```tsx
// src/features/procurement/components/products-import/import-header-form-wrapper.tsx
"use client";

import { useRouter } from "next/navigation";

import type { Option } from "@/types/index.types";

import { ImportHeaderForm } from "./import-header-form";

export function ImportHeaderFormWrapper({ stores }: { stores: Array<Option> }) {
  const router = useRouter();
  return <ImportHeaderForm stores={stores} onQueued={() => router.refresh()} />;
}
```

- [ ] **Step 2: Manual verification (full flow)**

Run: `pnpm dev` and `pnpm inngest` together. Visit `/procurement/products/import` as a `procurement:standard` (or similar) user:
1. Confirm Download Template / Upload are disabled until store + date are chosen.
2. Download the template, fill in 3 rows (one deliberately invalid — e.g. negative `opening_qty`), save, upload.
3. Confirm a toast fires and the batch appears in Recent Imports as `queued`, then transitions through `processing` to `completed_with_errors` without a manual page refresh (polling).
4. Confirm 2 new products exist in `/procurement/products` (inactive, category "row material", uom "pieces") and 2 `OPENING_BAL` stock movements exist for the chosen store/date.
5. Download the error report from the row action and confirm it contains only the 1 failed row with its message.
6. Confirm a completion email was attempted (check server logs / Resend dashboard / local email trap depending on `RESEND_API_KEY` config in `.env`).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(protected)/procurement/products/import/page.tsx" \
        src/features/procurement/components/products-import/import-header-form-wrapper.tsx
git commit -m "wire up product import page"
```

---

### Task 14: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full lint + typecheck + test suite**

Run: `pnpm lint:check && pnpm tsc --noEmit && pnpm test`
Expected: all green.

- [ ] **Step 2: Walk the acceptance criteria list in `instructions.md` §11 one by one**

Confirm each of the 10 checkboxes is genuinely satisfied by what was built (migration runs cleanly, template headers/example row, queue→Recent Imports immediately, product defaults exactly as specified, invalid rows don't block the batch, status transitions correctly, error report has only failed rows, email sent on completion, TanStack Form used not react-hook-form, UI uses real components/tokens not the mockup's raw markup).

- [ ] **Step 3: Note deviations from the mockup in a short summary for the user**

At minimum: `sku`/`uom`/`category` columns omitted from the template (schema doesn't support `sku`; `uom`/`category` are fixed defaults per doc scope); "re-import merges/adds to balance" copy not implemented (every row always creates new, per confirmed decision); file bytes stored as base64 in a DB column rather than object storage (no blob storage dependency existed in the repo); "get batch status" and "list recent batches" consolidated into one polling endpoint.

- [ ] **Step 4: No commit for this task** — it's verification only. If Step 1 or 2 surfaces a defect, fix it as a small follow-up commit referencing which task's file it belongs to.
