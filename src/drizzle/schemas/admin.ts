import {
  integer,
  pgTable,
  primaryKey,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { forms, users } from '@/drizzle/schema';

export const userRights = pgTable(
  'user_rights',
  {
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    formId: integer('form_id')
      .references(() => forms.id)
      .notNull(),
  },
  table => [primaryKey({ columns: [table.userId, table.formId] })]
);

export const permissions = pgTable(
  'permissions',
  {
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    permission: varchar('permission', { length: 64 }).notNull(),
  },
  table => [primaryKey({ columns: [table.userId, table.permission] })]
);
