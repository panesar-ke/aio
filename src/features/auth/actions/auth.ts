'use server';

import { randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { ActionResult } from '@/lib/actions/types';

import db from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { env } from '@/env/server';
import { hashPassword } from '@/features/admin/utils/helpers';
import { loginSchema } from '@/features/auth/actions/schema';
import {
  clearLoginFailures,
  LOGIN_ATTEMPT_WINDOW_MINUTES,
  markLoginAttemptSucceeded,
  reserveLoginAttempt,
} from '@/features/auth/services/login-throttle';
import { verifyPassword } from '@/features/auth/utils/password';
import {
  checkPasswordPolicy,
  CURRENT_POLICY_VERSION,
  isPolicyCompliant,
  parsePolicyDeadline,
} from '@/features/auth/utils/password-policy';
import { policyDeadlineNotification } from '@/features/auth/utils/policy-notification';
import { createNotification } from '@/features/global/services/actions';
import { redirectActionResult } from '@/lib/actions/results';
import { ActionError, parseOrFail, runAction } from '@/lib/actions/safe-action';
import { createSession, deleteSession } from '@/lib/session';

/**
 * The single answer to both "no such account" and "wrong password". These two
 * outcomes must be byte-identical, or the message itself tells an
 * unauthenticated caller which identifiers are real.
 */
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email/contact or password';

const dummyPassword = randomBytes(32).toString('base64url');

/**
 * A hash of throwaway random input, computed once at module load at the cost
 * factor `hashPassword` reads from BCRYPT_ROUNDS.
 *
 * Compared against when no user matches, so that branch spends the same bcrypt
 * time as a genuine wrong-password check. Skipping the comparison — as this
 * action used to — made "no such account" measurably faster to return and
 * leaked account existence by timing even once the messages were unified.
 */
let dummyPasswordHash = hashPassword(dummyPassword);

/**
 * The cost factor `dummyPasswordHash` was written at. BCRYPT_ROUNDS is only
 * the opening guess: bcrypt.compare works at whatever cost the *stored* hash
 * carries, so raising BCRYPT_ROUNDS for new passwords while existing accounts
 * still verify at the old cost would leave this branch several times slower
 * than a real check — reopening, in the opposite direction, the very oracle it
 * exists to close.
 */
let dummyRounds = Number(env.BCRYPT_ROUNDS);

// Marked handled so a hashing failure at import time cannot surface as an
// unhandled rejection. The `await` below still observes the same rejection,
// and catches it rather than letting it answer differently from a wrong
// password.
dummyPasswordHash.catch(() => {});

/**
 * Re-derives the dummy hash whenever a real stored hash turns out to carry a
 * different cost factor, so the two paths stay matched across a rounds change
 * without a second query to go looking for a representative hash.
 */
function noteStoredRounds(storedHash: string) {
  let rounds: number;

  try {
    rounds = bcrypt.getRounds(storedHash);
  } catch {
    // Not a hash a cost can be read off. Nothing to learn from it.
    return;
  }

  if (!Number.isInteger(rounds) || rounds === dummyRounds) return;

  dummyRounds = rounds;
  dummyPasswordHash = bcrypt.hash(dummyPassword, rounds);
  dummyPasswordHash.catch(() => {});
}

/**
 * Names roughly when the caller can retry. A nonexistent identifier reaches
 * this message on exactly the same terms as a real one, so it answers nothing
 * about whether an account exists.
 *
 * It does answer "are these two identifiers the same account?" for someone who
 * already knows both strings and will spend a whole budget on one of them to
 * find out, because the budget is shared across an account's email and contact.
 * Accepted deliberately: the alternative was two independent budgets, which is
 * twice as many password guesses against every account reachable both ways.
 */
function throttleMessage(retryAfter: Date | null, now: Date) {
  const minutes =
    retryAfter === null
      ? LOGIN_ATTEMPT_WINDOW_MINUTES
      : Math.max(1, Math.ceil((retryAfter.getTime() - now.getTime()) / 60_000));

  return `Too many failed sign-in attempts. Try again in about ${minutes} minute${
    minutes === 1 ? '' : 's'
  }.`;
}

export const loginAction = async (
  values: unknown,
): Promise<ActionResult<string>> =>
  runAction('login', async () => {
    const data = parseOrFail(loginSchema, values);

    // Already trimmed and lowercased by `requiredStringSchemaEntry`, so this is
    // the same normalized string the throttle counts on. Varying capitalization
    // therefore cannot win a fresh budget.
    const identifier = data.userName;

    const headersList = await headers();

    // Audit columns only. This is the same client-controlled `x-forwarded-for`
    // that session.ts reads for `sessions.ipAddress`, and nothing may gate on
    // it: the throttle keys on the identifier, and Arcjet keys on `ip.src`,
    // which a caller cannot set through a header.
    const attemptContext = {
      identifier,
      // `||`, not `??`: a header that is present but empty trims to '', which
      // is not nullish and would land in the column beside the NULLs that mean
      // "unknown".
      ipAddress:
        headersList.get('x-forwarded-for')?.split(',')[0].trim() || null,
      userAgent: headersList.get('user-agent'),
    };

    const now = new Date();

    const user = await db.query.users.findFirst({
      where: (users, { eq, or }) =>
        or(eq(users.email, identifier), eq(users.contact, identifier)),
    });

    // Every identifier that reaches the same account shares one budget. The
    // lookup above accepts either an email or a contact, so counting the
    // submitted string alone gave a user with both two independent budgets —
    // ten tries per window against one account rather than the five
    // login-throttle.ts documents. Resolving the user first costs a throttled
    // caller one indexed lookup they used to be spared; Arcjet's per-IP limit
    // is what caps how fast that can be repeated.
    const throttleIdentifiers = [
      ...new Set(
        [identifier, user?.contact, user?.email].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ];

    // Claimed, not merely checked. Counting the budget and recording the
    // attempt as two statements let a burst of simultaneous submissions all
    // read the same under-limit count before any of them wrote a row, so the
    // documented five-per-window held only for callers who waited their turn.
    //
    // The reservation writes the attempt row up front — a failure until the
    // password proves out — so nothing below has to record one, and a request
    // that dies mid-flight still counts. A refusal writes nothing: see
    // reserveLoginAttempt on why counting refusals stopped the window from
    // ever expiring.
    //
    // It is also the one write every login performs, successful or not, which
    // is what keeps a broken table (an unmigrated environment, say) from
    // answering differently for a right password than a wrong one.
    const reservation = await reserveLoginAttempt(
      {
        ...attemptContext,
        identifiers: throttleIdentifiers,
        userId: user?.id ?? null,
      },
      now,
    );

    if (!reservation.reserved) {
      throw new ActionError(throttleMessage(reservation.retryAfter, now));
    }

    if (!user) {
      // Pay the same bcrypt cost as a real check. `verifyPassword` compares
      // twice on every path, so this branch compares twice as well; both
      // results are discarded.
      try {
        const dummy = await dummyPasswordHash;

        await bcrypt.compare(data.password, dummy);
        await bcrypt.compare(data.password.toLowerCase(), dummy);
      } catch (equalizationError) {
        // A hashing failure at import time would otherwise escape as a generic
        // 'Something went wrong' here while a wrong password still returned the
        // shared message — a cleaner existence oracle than the timing this
        // block exists to hide. Fall through to the shared message instead.
        console.error('Failed to equalize login timing:', equalizationError);
      }

      throw new ActionError(INVALID_CREDENTIALS_MESSAGE);
    }

    noteStoredRounds(user.password);

    const verification = await verifyPassword(data.password, user.password, {
      // Only a hash that has never been rewritten since the casing fix can be
      // a hash of lowercased input.
      allowLegacyLowercase: user.passwordChangedAt === null,
    });

    if (!verification.ok) {
      // The reserved row already stands as this failure.
      throw new ActionError(INVALID_CREDENTIALS_MESSAGE);
    }

    // Deliberately after the password check, not before it. Whoever sees this
    // message has just proved they hold the account's password, so telling
    // them the account is deactivated explains the problem to its owner
    // without answering "does this account exist" for anyone else.
    if (!user.active) {
      throw new ActionError('Account is deactivated');
    }

    // Audit only, and no more essential than the rehash below: the credentials
    // are already proved by this point, so a write failure must not turn a
    // valid login into 'Something went wrong'.
    try {
      await markLoginAttemptSucceeded(reservation.attemptId);

      // Self-heals the counter now rather than leaving someone who mistyped a
      // few times one slip from being throttled for the rest of the window.
      await clearLoginFailures(throttleIdentifiers, now);
    } catch (attemptError) {
      console.error('Failed to record successful login:', attemptError);
    }

    // TRANSITIONAL: this hash predates the casing fix and is a hash of
    // lowercased input. Re-store it as typed so the account self-heals.
    // Stamping passwordChangedAt closes the lowercase fallback for this user:
    // the hash is now exact-case, so a later mis-cased attempt must fail.
    // Opportunistic only: a failure here must never block a valid login.
    if (verification.needsRehash) {
      try {
        await db
          .update(users)
          .set({
            password: await hashPassword(data.password),
            passwordChangedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      } catch (rehashError) {
        console.error('Failed to self-heal password hash:', rehashError);
      }
    }

    let compliant = isPolicyCompliant(user.passwordPolicyVersion);

    // The plaintext is only available here, so this is the one place an
    // existing password can be judged against the policy without forcing a
    // change.
    if (!compliant && checkPasswordPolicy(data.password, user).length === 0) {
      await db
        .update(users)
        .set({ passwordPolicyVersion: CURRENT_POLICY_VERSION })
        .where(eq(users.id, user.id));

      compliant = true;
    }

    const exemptUntil = user.passwordPolicyExemptUntil
      ? new Date(user.passwordPolicyExemptUntil)
      : null;

    const exempt = exemptUntil !== null && Date.now() < exemptUntil.getTime();

    if (!compliant && !exempt) {
      // Announce the deadline once per user per deadline. Opportunistic: a
      // notification failure must never stand between someone and their work.
      try {
        const deadline = parsePolicyDeadline(
          process.env.PASSWORD_POLICY_DEADLINE,
        );

        if (deadline) {
          await createNotification({
            ...policyDeadlineNotification(deadline),
            userId: user.id,
          });
        }
      } catch (notificationError) {
        console.error(
          'Failed to raise password policy notification:',
          notificationError,
        );
      }
    }

    await createSession(user.id, { policyCompliant: compliant || exempt });

    // Returned rather than redirected: redirect() signals by throwing, and
    // runAction's catch would swallow it into a generic failure.
    const destination = user.defaultMenu || '/dashboard';

    return redirectActionResult(
      destination,
      'Signed in successfully',
      destination,
    );
  });

export async function logoutAction() {
  await deleteSession();
  return redirect('/login');
}
