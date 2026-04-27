import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

import { createdAt, id, updatedAt } from '@/drizzle/helpers';
import { departments, users, vendors } from '@/drizzle/schema';

export const assetStatusEnum = pgEnum('asset_status', [
  'in_stock',
  'assigned',
  'in_repair',
  'retired',
  'disposed',
  'lost',
]);
export const assetConditionEnum = pgEnum('asset_condition', [
  'new',
  'good',
  'fair',
  'damaged',
  'refurbished',
]);

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

export const itAssetCategories = pgTable(
  'it_asset_categories',
  {
    id: varchar('id')
      .primaryKey()
      .notNull()
      .$defaultFn(() => nanoid()),
    name: varchar('name', { length: 150 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  t => [
    index('it_asset_category_name_idx').on(t.name),
    uniqueIndex('it_asset_category_name_ci_unique').on(sql`lower(${t.name})`),
  ],
);

export const itAssets = pgTable(
  'it_assets',
  {
    id: varchar('id')
      .primaryKey()
      .notNull()
      .$defaultFn(() => nanoid()),
    categoryId: varchar('category_id')
      .references(() => itAssetCategories.id)
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    brand: varchar('brand', { length: 150 }),
    model: varchar('model', { length: 150 }),
    serialNumber: varchar('serial_number', { length: 150 }),
    specs: jsonb('specs'),
    purchaseDate: date('purchase_date'),
    purchaseCost: numeric('purchase_cost', { precision: 14, scale: 2 }),
    vendorId: uuid('vendor_id').references(() => vendors.id),
    warrantyExpiryDate: date('warranty_expiry_date'),
    status: assetStatusEnum('status').default('in_stock').notNull(),
    condition: assetConditionEnum('condition').default('new').notNull(),
    departmentId: integer('department_id').references(() => departments.id),
    currentAssignedUserId: uuid('current_assigned_user_id').references(
      () => users.id,
    ),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => [
    index('it_assets_category_idx').on(table.categoryId),
    index('it_assets_name_idx').on(table.name),
    index('it_assets_brand_idx').on(table.brand),
    index('it_assets_model_idx').on(table.model),
    index('it_assets_serial_number_idx').on(table.serialNumber),
    index('it_assets_vendor_idx').on(table.vendorId),
    index('it_assets_status_idx').on(table.status),
    index('it_assets_condition_idx').on(table.condition),
    index('it_assets_department_idx').on(table.departmentId),
    index('it_assets_assigned_user_idx').on(table.currentAssignedUserId),
    uniqueIndex('it_assets_serial_number_ci_unique').on(
      sql`lower(${table.serialNumber})`,
    ),
  ],
);

export const itAssetAssignments = pgTable(
  'it_asset_assignments',
  {
    id: varchar('id')
      .primaryKey()
      .notNull()
      .$defaultFn(() => nanoid()),
    assetId: varchar('asset_id')
      .references(() => itAssets.id)
      .notNull(),
    userId: uuid('user_id').references(() => users.id),
    assignedDate: date('assigned_date').notNull(),
    returnedDate: date('returned_date'),
    assignmentNotes: text('assignment_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => [
    index('it_asset_assignments_asset_idx').on(table.assetId),
    index('it_asset_assignments_user_idx').on(table.userId),
    index('it_asset_assignments_assigned_date_idx').on(table.assignedDate),
    index('it_asset_assignments_returned_date_idx').on(table.returnedDate),
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

export const itAssetCategoriesRelations = relations(
  itAssetCategories,
  ({ many }) => ({
    itAssets: many(itAssets),
  }),
);

export const itAssetsRelations = relations(itAssets, ({ one, many }) => ({
  category: one(itAssetCategories, {
    fields: [itAssets.categoryId],
    references: [itAssetCategories.id],
  }),
  vendor: one(vendors, {
    fields: [itAssets.vendorId],
    references: [vendors.id],
  }),
  department: one(departments, {
    fields: [itAssets.departmentId],
    references: [departments.id],
  }),
  currentAssignedUser: one(users, {
    fields: [itAssets.currentAssignedUserId],
    references: [users.id],
    relationName: 'it_assets_current_assigned_user',
  }),
  createdByUser: one(users, {
    fields: [itAssets.createdBy],
    references: [users.id],
    relationName: 'it_assets_created_by_user',
  }),
  assignments: many(itAssetAssignments),
}));

export const itAssetAssignmentsRelations = relations(
  itAssetAssignments,
  ({ one }) => ({
    asset: one(itAssets, {
      fields: [itAssetAssignments.assetId],
      references: [itAssets.id],
    }),
    user: one(users, {
      fields: [itAssetAssignments.userId],
      references: [users.id],
    }),
  }),
);
