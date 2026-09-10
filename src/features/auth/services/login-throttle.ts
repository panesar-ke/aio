import 'server-only';

import { and, eq, gte, inArray, lt } from 'drizzle-orm';

import db from '@/drizzle/db';
import { loginAttempts } from '@/drizzle/schema';

/**
 * How many failed attempts an account may accumulate before sign-in is
 * refused, and the rolling window they are counted over. Kept adjacent so the
 * policy reads as one number pair, the way RESET_TOKEN_REQUEST_LIMIT and
 * RESET_TOKEN_REQUEST_WINDOW_MINUTES do in reset-token.ts.
 *
 * This is a throttle, not a lock: it expires on its own and needs no help-desk
 * involvement. That self-expiry is why an already-refused submission is never
 * recorded — see `recordLoginAttempt`. The accepted trade-off is that anyone
 * who knows a colleague's email can keep that one account throttled — strictly
 * better than a persistent lock that turns the same nuisance into a support
 * ticket.
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

/**
 * Rows removed per statement while pruning. This table takes a row per
 * credential submission and a spray writes rows for identifiers that match no
 * account, so a retention window can hold millions of them: one unbounded
 * DELETE would hold a lock for the whole scan and can outrun the Inngest step
 * timeout.
 */
const LOGIN_ATTEMPT_PRUNE_CHUNK = 5_000;

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
 * Whether these identifiers have spent their shared attempt budget, and when
 * they get it back.
 *
 * Keyed on identifier strings, never on a resolved user id. An identifier
 * belonging to no account must throttle exactly like one that does, otherwise
 * "did this request get throttled" becomes the account-existence oracle that
 * loginAction's uniform error messages exist to close.
 *
 * The caller passes every identifier the submitted one resolves to, because
 * `loginAction` accepts either an email or a contact for the same account:
 * counting only the submitted string handed a user with both two independent
 * budgets, which is twice LOGIN_ATTEMPT_LIMIT against one account. The cost of
 * sharing is that burning one identifier's budget also refuses the other, which
 * links them for anyone who already knows both — see `throttleMessage`.
 */
export async function isThrottled(
  identifiers: ReadonlyArray<string>,
  now: Date = new Date(),
): Promise<LoginThrottleState> {
  const failures = await db.query.loginAttempts.findMany({
    columns: { createdAt: true },
    where: and(
      inArray(loginAttempts.identifier, [...identifiers]),
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
 * Records one credential submission that reached a password check — success or
 * failure — so the table shows what was actually tried against an account.
 *
 * Submissions refused by the throttle itself are deliberately not recorded.
 * `isThrottled` derives `retryAfter` from the row at `count - LIMIT`, so every
 * extra row pushes that index toward the newer end: counting refusals let a
 * caller who kept retrying — exactly what the "try again in about N minutes"
 * message invites — extend their own block indefinitely, and the window would
 * only ever expire for someone who stopped trying.
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
 * Drops an account's in-window failures once it has proved itself. Without
 * this a legitimate user who mistyped four times would stay one slip away from
 * being throttled for the rest of the window, despite having just signed in.
 *
 * Bounded to the same window `isThrottled` counts, so it clears exactly what
 * was standing in the user's way and nothing else. An unbounded delete erased
 * the whole history for the identifier, which let a slow grind — one that
 * stayed under the limit for days and eventually guessed right — wipe every
 * trace of itself on the login it finally won.
 */
export async function clearLoginFailures(
  identifiers: ReadonlyArray<string>,
  now: Date = new Date(),
) {
  await db
    .delete(loginAttempts)
    .where(
      and(
        inArray(loginAttempts.identifier, [...identifiers]),
        eq(loginAttempts.succeeded, false),
        gte(loginAttempts.createdAt, loginAttemptWindowStart(now)),
      ),
    );
}

/**
 * Removes attempt rows past the retention window. Used by the nightly prune.
 *
 * Deletes in chunks and counts through `rowCount`: returning the deleted ids
 * to count them in memory pulled every pruned row's UUID into the job at once,
 * on the one table sized to absorb spray traffic.
 */
export async function deleteLoginAttemptsBefore(
  cutoff: Date,
  chunkSize: number = LOGIN_ATTEMPT_PRUNE_CHUNK,
) {
  let total = 0;

  for (;;) {
    const result = await db.delete(loginAttempts).where(
      inArray(
        loginAttempts.id,
        db
          .select({ id: loginAttempts.id })
          .from(loginAttempts)
          .where(lt(loginAttempts.createdAt, cutoff))
          .limit(chunkSize),
      ),
    );

    const deleted = result.rowCount ?? 0;
    total += deleted;

    if (deleted < chunkSize) {
      return total;
    }
  }
}
