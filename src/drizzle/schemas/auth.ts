// import { relations } from 'drizzle-orm';
// import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
// import { users } from '@/drizzle/schema';

// export const sessions = pgTable('sessions', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   userId: uuid('user_id')
//     .references(() => users.id)
//     .notNull(),
//   expiresAt: timestamp('expires_at').notNull(),
//   createdAt: timestamp('created_at').defaultNow().notNull(),
//   userAgent: text('user_agent'),
//   ipAddress: text('ip_address'),
// });

// export const sessionsRelations = relations(sessions, ({ one }) => ({
//   user: one(users, { fields: [sessions.userId], references: [users.id] }),
// }));

// export const loginAttempts = pgTable('login_attempts', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   userName: text('user_name').notNull(),
//   timestamp: timestamp('timestamp').defaultNow().notNull(),
//   success: text('success').notNull(),
//   ipAddress: text('ip_address').notNull(),
// });
