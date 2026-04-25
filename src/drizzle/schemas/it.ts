import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

import { createdAt, id, updatedAt } from '@/drizzle/helpers';
import { vendors } from '@/drizzle/schema';

export const itCategories = pgTable(
  'it_categories',
  {
    id,
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt,
    updatedAt,
  },
  t => [
    index('it_category_name_idx').on(t.name),
    uniqueIndex('it_category_name_ci_unique').on(sql`lower(${t.name})`),
  ],
);

export const itSubCategories = pgTable(
  'it_sub_categories',
  {
    id,
    name: varchar('name', { length: 255 }).notNull(),
    categoryId: varchar('category_id')
      .notNull()
      .references(() => itCategories.id),
    createdAt,
    updatedAt,
  },
  t => [
    index('it_sub_category_name_idx').on(t.name),
    index('it_sub_category_category_idx').on(t.categoryId),
    uniqueIndex('it_sub_category_name_category_ci_unique').on(
      sql`lower(${t.name})`,
      t.categoryId,
    ),
  ],
);

export const itExpenses = pgTable(
  'it_expenses',
  {
    id: varchar('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    expenseDate: date('expense_date').notNull(),
    referenceNo: varchar('reference_no', { length: 100 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    categoryId: varchar('category_id')
      .references(() => itCategories.id)
      .notNull(),
    subCategoryId: varchar('sub_category_id')
      .references(() => itSubCategories.id)
      .notNull(),
    vendorId: uuid('vendor_id')
      .references(() => vendors.id)
      .notNull(),
    assetId: uuid('asset_id'),
    licenseId: uuid('license_id'),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  t => [
    index('it_expense_name_idx').on(t.title),
    index('it_expense_date_idx').on(t.expenseDate),
    index('it_expense_category_idx').on(t.categoryId),
    index('it_expense_sub_category_idx').on(t.subCategoryId),
    index('it_expense_vendor_idx').on(t.vendorId),
    index('it_expense_asset_idx').on(t.assetId),
    index('it_expense_license_idx').on(t.licenseId),
    index('it_expense_amount_idx').on(t.amount),
    uniqueIndex('it_expense_reference_no_ci_unique').on(
      sql`lower(${t.referenceNo})`,
    ),
  ],
);

export const itCategoriesRelations = relations(itCategories, ({ many }) => ({
  itSubCategories: many(itSubCategories),
  itExpenses: many(itExpenses),
}));

export const itSubCategoriesRelations = relations(
  itSubCategories,
  ({ one, many }) => ({
    itCategory: one(itCategories, {
      fields: [itSubCategories.categoryId],
      references: [itCategories.id],
    }),
    itExpenses: many(itExpenses),
  }),
);

export const itExpensesRelations = relations(itExpenses, ({ one }) => ({
  itCategory: one(itCategories, {
    fields: [itExpenses.categoryId],
    references: [itCategories.id],
  }),
  itSubCategory: one(itSubCategories, {
    fields: [itExpenses.subCategoryId],
    references: [itSubCategories.id],
  }),
  vendor: one(vendors, {
    fields: [itExpenses.vendorId],
    references: [vendors.id],
  }),
}));
