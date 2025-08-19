import { relations } from 'drizzle-orm';
import { numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { products, vendors } from '@/drizzle/schema';

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
