import { integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
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
