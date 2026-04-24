import {
  index,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { id, createdAt, updatedAt } from '@/drizzle/helpers';

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
