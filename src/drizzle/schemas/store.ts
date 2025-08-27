import { relations } from 'drizzle-orm';
import { index, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { grnsHeader, materialIssuesHeader } from '@/drizzle/schema';

export const stores = pgTable(
  'stores',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    storeName: varchar('store_name', { length: 255 }).unique().notNull(),
    description: text('description').notNull(),
  },
  table => [
    index('store_idx').on(table.storeName),
    index('store_description_idx').on(table.description),
  ]
);

export const storesRelations = relations(stores, ({ many }) => ({
  grns: many(grnsHeader),
  materialIssues: many(materialIssuesHeader),
}));
