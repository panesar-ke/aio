import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const id = varchar('id')
  .primaryKey()
  .$defaultFn(() => nanoid());

export const active = boolean('active').notNull().default(true);
export const createdAt = timestamp('created_at', { withTimezone: true })
  .notNull()
  .defaultNow();
export const updatedAt = timestamp('updated_at', { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

export const itCategories = pgTable(
  'it_categories',
  {
    id,
    name: varchar('name', { length: 255 }).unique().notNull(),
    description: text('description'),
    createdAt,
    updatedAt,
  },
  t => [index('it_category_name_idx').on(t.name)],
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
    uniqueIndex('it_sub_category_name_category_unique').on(t.name, t.categoryId),
  ],
);
