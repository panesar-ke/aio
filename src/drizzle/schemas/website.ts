import {
  bigint,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const websiteEnquiryDedup = pgTable(
  'website_enquiry_dedup',
  {
    fingerPrint: varchar('finger_print', { length: 255 }).notNull(),
    senderEmail: varchar('sender_email', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => [primaryKey({ columns: [table.fingerPrint, table.senderEmail] })],
);

export const websiteRoundRobin = pgTable('website_round_robin', {
  id: integer('id').primaryKey().notNull(),
  counter: bigint('counter', { mode: 'bigint' }).notNull(),
});
