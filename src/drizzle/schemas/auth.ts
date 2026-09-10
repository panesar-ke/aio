import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from '@/drizzle/migrations/schema';

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index('password_reset_tokens_user_id_idx').on(table.userId),
  ]
);

/**
 * One row per credential submission, successful or not. Feeds the login
 * throttle in `login-throttle.ts`.
 *
 * Keyed for lookup on `identifier`, not `userId`: an identifier matching no
 * account must be throttled exactly like one that does, or whether a request
 * gets throttled becomes the enumeration oracle the rest of the login path
 * was hardened to remove. `userId` is recorded for audit only.
 */
export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /**
     * Stored exactly as `loginSchema` normalizes it — trimmed and lowercased
     * (see `requiredStringSchemaEntry`). Storing the raw submission instead
     * would let an attacker win a fresh budget by varying capitalization.
     */
    identifier: text('identifier').notNull(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    succeeded: boolean('succeeded').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index('login_attempts_identifier_created_at_idx').on(
      table.identifier,
      table.createdAt.desc()
    ),
    index('login_attempts_created_at_idx').on(table.createdAt),
  ]
);
