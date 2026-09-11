import 'server-only';

import { and, eq, gte, inArray, lt, sql } from 'drizzle-orm';

import db from '@/drizzle/db';
import { loginAttempts } from '@/drizzle/schema';
import {
  boundedAuditField,
  MAX_LOGIN_IDENTIFIER_LENGTH,
  MAX_LOGIN_IP_ADDRESS_LENGTH,
  MAX_LOGIN_USER_AGENT_LENGTH,
} from '@/features/auth/utils/login-attempt-fields';

/**
 * How many failed attempts an account may accumulate before sign-in is
 * refused, and the rolling window they are counted over. Kept adjacent so the
 * policy reads as one number pair, the way RESET_TOKEN_REQUEST_LIMIT and
 * RESET_TOKEN_REQUEST_WINDOW_MINUTES do in reset-token.ts.
 *
 * This is a throttle, not a lock: it expires on its own and needs no help-desk
 * involvement. That self-expiry is why an already-refused submission is never
 * recorded — see `reserveLoginAttempt`. The accepted trade-off is that anyone
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
 * DELETE would hold a lock for the whole scan.
 *
 * Exported because the prune job compares each chunk against it to decide
 * whether the backlog is exhausted.
 */
export const LOGIN_ATTEMPT_PRUNE_CHUNK = 5_000;

/**
 * First key of the advisory lock `reserveLoginAttempt` takes. Arbitrary, and
 * only has to stay clear of any other advisory lock this app takes.
 */
const LOGIN_THROTTLE_LOCK_NAMESPACE = 1_918_274;

/** Start of the trailing window failed attempts are counted within. */
export function loginAttemptWindowStart(now: Date) {
  return new Date(now.getTime() - LOGIN_ATTEMPT_WINDOW_MINUTES * 60 * 1000);
}

type LoginThrottleState = {
  throttled: boolean;
  /** When sign-in reopens. Null whenever `throttled` is false. */
  retryAfter: Date | null;
};

type LoginAttemptReservation =
  | { reserved: true; attemptId: string }
  | { reserved: false; retryAfter: Date | null };

/** Anything that can run the window query — the pool, or one transaction. */
type ThrottleReader = Pick<typeof db, 'query'>;

/**
 * One lock key per identifier *set*, sorted so the same account serializes on
 * the same key whether the caller submitted its email or its contact. Joined
 * on NUL, which a normalized identifier cannot contain, so no two sets can
 * collide by concatenating to the same string.
 */
function throttleLockKey(identifiers: ReadonlyArray<string>) {
  return [...identifiers].sort().join('\u0000');
}

/**
 * In-window failures for these identifiers, oldest first.
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
async function windowFailures(
  reader: ThrottleReader,
  identifiers: ReadonlyArray<string>,
  now: Date,
) {
  return reader.query.loginAttempts.findMany({
    columns: { createdAt: true },
    where: and(
      inArray(loginAttempts.identifier, [...identifiers]),
      eq(loginAttempts.succeeded, false),
      gte(loginAttempts.createdAt, loginAttemptWindowStart(now)),
    ),
    orderBy: (table, { asc }) => asc(table.createdAt),
    limit: LOGIN_ATTEMPT_SCAN_LIMIT,
  });
}

function throttleStateFrom(
  failures: ReadonlyArray<{ createdAt: Date }>,
): LoginThrottleState {
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
 * Claims one of an account's attempts if its budget has room, writing the
 * attempt row up front rather than after the password check.
 *
 * Counting first and recording afterwards did not survive concurrency: N
 * simultaneous submissions all read the same under-limit count before any of
 * them had written a row, so a burst bought as many password checks as it had
 * connections and the documented five-per-window became five *sequential*
 * round-trips. Counting and inserting under one transaction-scoped advisory
 * lock makes the Nth caller see the N-1 rows ahead of it. A plain conditional
 * INSERT would not: under READ COMMITTED each statement counts against a
 * snapshot taken before its peers committed.
 *
 * The lock is held only for the count and the insert. bcrypt runs after it is
 * released, so a slow verification never pins a pooled connection.
 *
 * The row goes in as a failure and is flipped by `markLoginAttemptSucceeded`
 * once the credentials prove out, so an attempt abandoned mid-flight — a
 * crash, a dropped connection — counts against the budget rather than
 * vanishing from it.
 *
 * Submissions the throttle itself refuses are deliberately never recorded.
 * `retryAfter` is derived from the row at `count - LIMIT`, so every extra row
 * pushes that index toward the newer end: counting refusals let a caller who
 * kept retrying — exactly what the "try again in about N minutes" message
 * invites — extend their own block indefinitely, and the window would only
 * ever expire for someone who stopped trying.
 *
 * `ipAddress` and `userAgent` are audit columns. Nothing reads them to make a
 * decision, and nothing should: both are client-supplied, and both are bounded
 * here for the same reason `identifier` is.
 */
export async function reserveLoginAttempt(
  attempt: {
    /** Every identifier sharing this account's budget. */
    identifiers: ReadonlyArray<string>;
    /** The one actually submitted, recorded as typed (after normalizing). */
    identifier: string;
    userId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
  now: Date = new Date(),
): Promise<LoginAttemptReservation> {
  return db.transaction(async tx => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${LOGIN_THROTTLE_LOCK_NAMESPACE}::int4, hashtext(${throttleLockKey(
        attempt.identifiers,
      )})::int4)`,
    );

    const state = throttleStateFrom(
      await windowFailures(tx, attempt.identifiers, now),
    );

    if (state.throttled) {
      return { reserved: false, retryAfter: state.retryAfter };
    }

    const [row] = await tx
      .insert(loginAttempts)
      .values({
        identifier: attempt.identifier.slice(0, MAX_LOGIN_IDENTIFIER_LENGTH),
        succeeded: false,
        userId: attempt.userId ?? null,
        ipAddress: boundedAuditField(
          attempt.ipAddress,
          MAX_LOGIN_IP_ADDRESS_LENGTH,
        ),
        userAgent: boundedAuditField(
          attempt.userAgent,
          MAX_LOGIN_USER_AGENT_LENGTH,
        ),
      })
      .returning({ id: loginAttempts.id });

    return { reserved: true, attemptId: row.id };
  });
}

/**
 * Turns a reserved attempt into the record of a successful sign-in. Audit
 * only: the credentials are already proved by the time this runs, so a failure
 * here must never deny the login — it only leaves the row counted as a failure
 * until it ages out.
 */
export async function markLoginAttemptSucceeded(attemptId: string) {
  await db
    .update(loginAttempts)
    .set({ succeeded: true })
    .where(eq(loginAttempts.id, attemptId));
}

/**
 * Drops an account's in-window failures once it has proved itself. Without
 * this a legitimate user who mistyped four times would stay one slip away from
 * being throttled for the rest of the window, despite having just signed in.
 *
 * Bounded to the same window the reservation counts, so it clears exactly what
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
 * Removes up to one chunk of attempt rows past the retention window, reporting
 * how many went. The nightly prune drives the loop, one Inngest step per call,
 * so the backlog is bounded per step rather than per run: a single step
 * grinding through millions of rows outruns the client's `maxRuntime` and
 * fails the whole job.
 *
 * Counts through `rowCount`: returning the deleted ids to count them in memory
 * pulled every pruned row's UUID into the job at once, on the one table sized
 * to absorb spray traffic.
 */
export async function deleteLoginAttemptsChunk(
  cutoff: Date,
  chunkSize: number = LOGIN_ATTEMPT_PRUNE_CHUNK,
) {
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

  return result.rowCount ?? 0;
}
