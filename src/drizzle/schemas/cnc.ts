import {
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from '../schema';

export const jobStatusEnum = pgEnum('job_status', [
  'on hold',
  'in progress',
  'completed',
]);

export const cncJobTracker = pgTable(
  'cnc_job_tracker',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    dateReceived: date('date_received').notNull(),
    jobCardNo: varchar('job_card_no', { length: 6 }).notNull(),
    jobDescription: varchar('job_description', { length: 255 }).notNull(),
    jobType: varchar('job_type', { length: 255 }).notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    timeSpent: numeric('time_spent').notNull().default('0'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    status: jobStatusEnum('status').notNull().default('in progress'),
  },
  table => [
    index('job_card_no_idx').on(table.jobCardNo),
    index('job_description_idx').on(table.jobDescription),
    index('job_type_idx').on(table.jobType),
    index('start_date_idx').on(table.startDate),
    index('end_date_idx').on(table.endDate),
  ]
);
