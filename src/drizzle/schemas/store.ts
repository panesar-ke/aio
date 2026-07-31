import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import {
  grnsHeader,
  materialIssuesHeader,
  products,
  users,
} from '@/drizzle/schema';

export const stores = pgTable(
  'stores',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    storeName: varchar('store_name', { length: 255 }).unique().notNull(),
    description: text('description').notNull(),
    isMain: boolean('is_main').notNull().default(false),
  },
  table => [
    index('store_idx').on(table.storeName),
    index('store_description_idx').on(table.description),
  ],
);

export const storesRelations = relations(stores, ({ many }) => ({
  grns: many(grnsHeader),
  materialIssues: many(materialIssuesHeader),
}));

export const materialTransferHeader = pgTable('material_transfer_header', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  transferDate: timestamp('transfer_date').notNull(),
  fromStoreId: uuid('from_store_id')
    .references(() => stores.id)
    .notNull(),
  toStoreId: uuid('to_store_id')
    .references(() => stores.id)
    .notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const materialTransferRelations = relations(
  materialTransferHeader,
  ({ one, many }) => ({
    fromStore: one(stores, {
      fields: [materialTransferHeader.fromStoreId],
      references: [stores.id],
    }),
    toStore: one(stores, {
      fields: [materialTransferHeader.toStoreId],
      references: [stores.id],
    }),
    materials: many(materialsTransferDetails),
  }),
);

export const materialsTransferDetails = pgTable('materials_transfer_details', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  headerId: uuid('header_id')
    .references(() => materialTransferHeader.id)
    .notNull(),
  itemId: uuid('item_id')
    .references(() => products.id)
    .notNull(),
  transferredQty: numeric('transferred_qty', {
    precision: 10,
    scale: 2,
  }).notNull(),
  stockBalance: numeric('stock_balance', { precision: 10, scale: 2 }).notNull(),
  remarks: text('remarks'),
});

export const materialsTransferDetailsRelations = relations(
  materialsTransferDetails,
  ({ one }) => ({
    header: one(materialTransferHeader, {
      fields: [materialsTransferDetails.headerId],
      references: [materialTransferHeader.id],
    }),
    item: one(products, {
      fields: [materialsTransferDetails.itemId],
      references: [products.id],
    }),
  }),
);

export const stockBalanceSnapshots = pgTable(
  'stock_balance_snapshots',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .references(() => products.id)
      .notNull(),
    storeId: uuid('store_id')
      .references(() => stores.id)
      .notNull(),
    snapshotDate: date('snapshot_date').notNull(),
    closingBalance: numeric('closing_balance').notNull(),
    createdOn: timestamp('created_on').defaultNow(),
  },
  table => [
    uniqueIndex('stock_balance_snapshots_item_store_date_idx').on(
      table.itemId,
      table.storeId,
      table.snapshotDate,
    ),
  ],
);

export const stockBalanceSnapshotsRelations = relations(
  stockBalanceSnapshots,
  ({ one }) => ({
    item: one(products, {
      fields: [stockBalanceSnapshots.itemId],
      references: [products.id],
    }),
    store: one(stores, {
      fields: [stockBalanceSnapshots.storeId],
      references: [stores.id],
    }),
  }),
);

export const productDeactivationBatches = pgTable(
  'product_deactivation_batches',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    deactivationDate: timestamp('deactivation_date').notNull().defaultNow(),
    thresholdDays: integer('threshold_days').notNull(),
    totalCount: integer('total_count').notNull(),
  },
);

export const productDeactivationBatchesRelations = relations(
  productDeactivationBatches,
  ({ many }) => ({
    items: many(productDeactivationItems),
  }),
);

export const productDeactivationItems = pgTable('product_deactivation_items', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  batchId: uuid('batch_id')
    .references(() => productDeactivationBatches.id)
    .notNull(),
  productId: uuid('product_id')
    .references(() => products.id)
    .notNull(),
  lastUsedDate: date('last_used_date'),
  lastUsedSource: varchar('last_used_source').notNull(),
  balanceAtDeactivation: numeric('balance_at_deactivation'),
  reactivated: boolean('reactivated').notNull().default(false),
  reactivatedBy: uuid('reactivated_by').references(() => users.id),
  reactivatedOn: timestamp('reactivated_on'),
});

export const productDeactivationItemsRelations = relations(
  productDeactivationItems,
  ({ one }) => ({
    batch: one(productDeactivationBatches, {
      fields: [productDeactivationItems.batchId],
      references: [productDeactivationBatches.id],
    }),
    product: one(products, {
      fields: [productDeactivationItems.productId],
      references: [products.id],
    }),
    reactivatedByUser: one(users, {
      fields: [productDeactivationItems.reactivatedBy],
      references: [users.id],
    }),
  }),
);
