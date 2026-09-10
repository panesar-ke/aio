'use server';

import { randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { ActionResult } from '@/lib/actions/types';

import db from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { hashPassword } from '@/features/admin/utils/helpers';
import { loginSchema } from '@/features/auth/actions/schema';
import {
  clearLoginFailures,
  isThrottled,
  LOGIN_ATTEMPT_WINDOW_MINUTES,
  recordLoginAttempt,
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

/**
 * A hash of throwaway random input, computed once at module load at the same
 * cost factor as every real password (`hashPassword` reads BCRYPT_ROUNDS).
 *
 * Compared against when no user matches, so that branch spends the same bcrypt
 * time as a genuine wrong-password check. Skipping the comparison — as this
 * action used to — made "no such account" measurably faster to return and
 * leaked account existence by timing even once the messages were unified.
 */
const dummyPasswordHash = hashPassword(randomBytes(32).toString('base64url'));

// Marked handled so a hashing failure at import time cannot surface as an
// unhandled rejection. The `await` below still observes the same rejection.
dummyPasswordHash.catch(() => {});

/**
 * Names roughly when the caller can retry. Safe to be specific: the throttle
 * counts identifiers, not accounts, so a nonexistent identifier reaches this
 * message on exactly the same terms as a real one.
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
      ipAddress:
        headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? null,
      userAgent: headersList.get('user-agent'),
    };

    const now = new Date();
    const throttle = await isThrottled(identifier, now);

    // Checked before the user lookup, so a throttled identifier costs one
    // indexed count and never touches the users table.
    if (throttle.throttled) {
      await recordLoginAttempt({ ...attemptContext, succeeded: false });
      throw new ActionError(throttleMessage(throttle.retryAfter, now));
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq, or }) =>
        or(eq(users.email, identifier), eq(users.contact, identifier)),
    });

    if (!user) {
      // Pay the bcrypt cost anyway. The result is discarded — it exists purely
      // so this branch takes as long as the wrong-password branch below.
      await bcrypt.compare(data.password, await dummyPasswordHash);
      await recordLoginAttempt({ ...attemptContext, succeeded: false });
      throw new ActionError(INVALID_CREDENTIALS_MESSAGE);
    }

    const verification = await verifyPassword(data.password, user.password, {
      // Only a hash that has never been rewritten since the casing fix can be
      // a hash of lowercased input.
      allowLegacyLowercase: user.passwordChangedAt === null,
    });

    if (!verification.ok) {
      await recordLoginAttempt({
        ...attemptContext,
        succeeded: false,
        userId: user.id,
      });
      throw new ActionError(INVALID_CREDENTIALS_MESSAGE);
    }

    // Deliberately after the password check, not before it. Whoever sees this
    // message has just proved they hold the account's password, so telling
    // them the account is deactivated explains the problem to its owner
    // without answering "does this account exist" for anyone else.
    if (!user.active) {
      await recordLoginAttempt({
        ...attemptContext,
        succeeded: false,
        userId: user.id,
      });
      throw new ActionError('Account is deactivated');
    }

    await recordLoginAttempt({
      ...attemptContext,
      succeeded: true,
      userId: user.id,
    });

    // Self-heals the counter now rather than leaving someone who mistyped a
    // few times one slip from being throttled for the rest of the window.
    await clearLoginFailures(identifier);

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
