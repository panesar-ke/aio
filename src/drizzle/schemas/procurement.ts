import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { products, stores, users, vendors } from '@/drizzle/schema';

export const autoOrdersItems = pgTable('auto_order_items', {
  id: text('id').primaryKey().notNull(),
  productId: uuid('product_id')
    .references(() => products.id)
    .notNull(),
  vendorId: uuid('vendor_id')
    .references(() => vendors.id)
    .notNull(),
  reorderLevel: numeric('reorder_level').notNull(),
  reorderQty: numeric('reorder_qty').notNull(),
});

export const autoOrderRelations = relations(autoOrdersItems, ({ one }) => ({
  product: one(products, {
    fields: [autoOrdersItems.productId],
    references: [products.id],
  }),
  vendor: one(vendors, {
    fields: [autoOrdersItems.vendorId],
    references: [vendors.id],
  }),
}));

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
