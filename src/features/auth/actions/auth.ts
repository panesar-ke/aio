'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import type { ActionResult } from '@/lib/actions/types';

import db from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { hashPassword } from '@/features/admin/utils/helpers';
import { loginSchema } from '@/features/auth/actions/schema';
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

export const loginAction = async (
  values: unknown,
): Promise<ActionResult<string>> =>
  runAction('login', async () => {
    const data = parseOrFail(loginSchema, values);

    const user = await db.query.users.findFirst({
      where: (users, { eq, or }) =>
        or(eq(users.email, data.userName), eq(users.contact, data.userName)),
    });

    if (!user) {
      throw new ActionError('User not found');
    }

    if (!user.active) {
      throw new ActionError('Account is deactivated');
    }

    const verification = await verifyPassword(data.password, user.password);

    if (!verification.ok) {
      throw new ActionError('Invalid credentials');
    }

    // TRANSITIONAL: this hash predates the casing fix and is a hash of
    // lowercased input. Re-store it as typed so the account self-heals.
    // Opportunistic only: a failure here must never block a valid login.
    if (verification.needsRehash) {
      try {
        await db
          .update(users)
          .set({ password: await hashPassword(data.password) })
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
