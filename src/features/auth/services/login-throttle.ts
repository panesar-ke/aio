import 'server-only';

import { and, eq, gte, lt } from 'drizzle-orm';

import db from '@/drizzle/db';
import { loginAttempts } from '@/drizzle/schema';

/**
 * How many failed attempts an identifier may accumulate before sign-in is
 * refused, and the rolling window they are counted over. Kept adjacent so the
 * policy reads as one number pair, the way RESET_TOKEN_REQUEST_LIMIT and
 * RESET_TOKEN_REQUEST_WINDOW_MINUTES do in reset-token.ts.
 *
 * This is a throttle, not a lock: it expires on its own and needs no help-desk
 * involvement. The accepted trade-off is that anyone who knows a colleague's
 * email can keep that one account throttled — strictly better than a
 * persistent lock that turns the same nuisance into a support ticket.
 */
export const LOGIN_ATTEMPT_LIMIT = 5;
export const LOGIN_ATTEMPT_WINDOW_MINUTES = 15;

/** How long attempt rows are kept before the nightly prune removes them. */
export const LOGIN_ATTEMPT_RETENTION_DAYS = 30;

/**
 * Ceiling on rows read when estimating the retry time. Well above the limit,
 * so it only bites under a sustained attack — and there it can only make the
 * estimate earlier than the truth, never later, so the caller is told to retry
 * too soon rather than being blocked past the real window.
 */
const LOGIN_ATTEMPT_SCAN_LIMIT = 100;

/** Start of the trailing window failed attempts are counted within. */
export function loginAttemptWindowStart(now: Date) {
  return new Date(now.getTime() - LOGIN_ATTEMPT_WINDOW_MINUTES * 60 * 1000);
}

export type LoginThrottleState = {
  throttled: boolean;
  /** When sign-in reopens. Null whenever `throttled` is false. */
  retryAfter: Date | null;
};

/**
 * Whether this identifier has spent its attempt budget, and when it gets it
 * back.
 *
 * Keyed on the identifier string alone — never on a resolved user id. An
 * identifier belonging to no account must throttle exactly like one that does,
 * otherwise "did this request get throttled" becomes the account-existence
 * oracle that loginAction's uniform error messages exist to close.
 */
export async function isThrottled(
  identifier: string,
  now: Date = new Date(),
): Promise<LoginThrottleState> {
  const failures = await db.query.loginAttempts.findMany({
    columns: { createdAt: true },
    where: and(
      eq(loginAttempts.identifier, identifier),
      eq(loginAttempts.succeeded, false),
      gte(loginAttempts.createdAt, loginAttemptWindowStart(now)),
    ),
    orderBy: (table, { asc }) => asc(table.createdAt),
    limit: LOGIN_ATTEMPT_SCAN_LIMIT,
  });

  if (failures.length < LOGIN_ATTEMPT_LIMIT) {
    return { throttled: false, retryAfter: null };
  }

  // Failures age out oldest-first, so sign-in reopens once enough of them have
  // left the window to bring the count back under the limit. That takes
  // `count - LIMIT + 1` expiries, and the last of those is the row at index
  // `count - LIMIT`.
  const unblockingAttempt = failures[failures.length - LOGIN_ATTEMPT_LIMIT];

  return {
    throttled: true,
    retryAfter: new Date(
      unblockingAttempt.createdAt.getTime() +
        LOGIN_ATTEMPT_WINDOW_MINUTES * 60 * 1000,
    ),
  };
}

/**
 * Records one credential submission. Called for every outcome — success,
 * failure, and refusals that never reached a password check — so the table is
 * a complete record of what was tried.
 *
 * `ipAddress` and `userAgent` are audit columns. Nothing reads them to make a
 * decision, and nothing should: both are client-supplied.
 */
export async function recordLoginAttempt(attempt: {
  identifier: string;
  succeeded: boolean;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await db.insert(loginAttempts).values({
    identifier: attempt.identifier,
    succeeded: attempt.succeeded,
    userId: attempt.userId ?? null,
    ipAddress: attempt.ipAddress ?? null,
    userAgent: attempt.userAgent ?? null,
  });
}

/**
 * Drops an identifier's failures once it has proved itself. Without this a
 * legitimate user who mistyped four times would stay one slip away from being
 * throttled for the rest of the window, despite having just signed in.
 */
export async function clearLoginFailures(identifier: string) {
  await db
    .delete(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, identifier),
        eq(loginAttempts.succeeded, false),
      ),
    );
}

/** Removes attempt rows past the retention window. Used by the nightly prune. */
export async function deleteLoginAttemptsBefore(cutoff: Date) {
  const deleted = await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.createdAt, cutoff))
    .returning({ id: loginAttempts.id });

  return deleted.length;
}
