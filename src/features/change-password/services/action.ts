'use server';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import type {
  ApiFailureWithoutData,
  ApiSuccessWithoutData,
} from '@/types/index.types';

import db from '@/drizzle/db';
import { sessions, users } from '@/drizzle/schema';
import { env } from '@/env/server';
import { verifyPassword } from '@/features/auth/utils/password';
import {
  checkPasswordPolicy,
  CURRENT_POLICY_VERSION,
  isPolicyCompliant,
  policyFailureMessage,
} from '@/features/auth/utils/password-policy';
import {
  type ChangePasswordFormValues,
  changePasswordSchema,
} from '@/features/change-password/utils/schema';
import { validateFields } from '@/lib/action-validator';
import {
  createSession,
  getCurrentUser,
  getCurrentUserOrNull,
  getSession,
} from '@/lib/session';

export async function changePasswordAction(
  values: unknown
): Promise<ApiSuccessWithoutData | ApiFailureWithoutData> {
  const { data, error } = validateFields<ChangePasswordFormValues>(
    values,
    changePasswordSchema
  );

  if (error !== null) {
    return {
      error: true,
      message: 'Validation failed! Please check your input.',
    };
  }

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        error: true,
        message: 'User not authenticated.',
      };
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, currentUser.id),
      columns: {
        id: true,
        password: true,
        passwordChangedAt: true,
        name: true,
        email: true,
        contact: true,
      },
    });

    if (!user) {
      return {
        error: true,
        message: 'User not found.',
      };
    }

    // Uses verifyPassword rather than a direct bcrypt.compare so a legacy
    // hash-of-lowercased-input still verifies against the as-typed password.
    // No needsRehash handling here: the update below always re-hashes and
    // stores the new password, making a separate rehash of the old one moot.
    const verification = await verifyPassword(
      data.currentPassword,
      user.password,
      { allowLegacyLowercase: user.passwordChangedAt === null }
    );

    if (!verification.ok) {
      return {
        error: true,
        message: 'Current password is incorrect.',
      };
    }

    const failures = checkPasswordPolicy(data.newPassword, user);

    if (failures.length > 0) {
      return {
        error: true,
        message: policyFailureMessage(failures[0]),
      };
    }

    const saltRounds = Number(env.BCRYPT_ROUNDS);
    const hashedNewPassword = await bcrypt.hash(data.newPassword, saltRounds);

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          password: hashedNewPassword,
          passwordPolicyVersion: CURRENT_POLICY_VERSION,
          passwordChangedAt: new Date(),
        })
        .where(eq(users.id, currentUser.id));

      // Changing a password must sign out every other device, including one
      // holding a stolen cookie. Session rows are what make a cookie usable
      // (see getCurrentUserOrNull), so deleting them is the revocation.
      await tx.delete(sessions).where(eq(sessions.userId, currentUser.id));
    });

    // Issued after the revocation, so this device keeps working and the gate
    // lifts now rather than at next login.
    await createSession(currentUser.id, { policyCompliant: true });

    return {
      error: false,
      message: 'Password changed successfully!',
    };
  } catch (error) {
    console.error('Error changing password:', error);
    return {
      error: true,
      message:
        'An error occurred while changing your password. Please try again.',
    };
  }
}

/**
 * Lifts the policy gate for a user whose cookie still says non-compliant but
 * whose record no longer is — in practice, an admin granting an exemption
 * after the deadline has already passed.
 *
 * The gate lives in the proxy, which cannot reach the database, so it decides
 * on the JWT claim alone. Without this the only way to pick up a fresh
 * exemption is to sign out and back in, which the user is never told to do —
 * they are stuck being redirected to this page on every navigation. Runs as a
 * server action because re-issuing the cookie is a write, and only re-issues
 * when the claim is the thing that is stale, so a compliant user who came here
 * voluntarily is left alone.
 */
export async function releasePolicyGateAction(): Promise<{
  destination: string;
} | null> {
  const session = await getSession().catch(() => null);

  if (session?.policyCompliant !== false) {
    return null;
  }

  const user = await getCurrentUserOrNull();

  if (!user) {
    return null;
  }

  const exemptUntil = user.passwordPolicyExemptUntil
    ? new Date(user.passwordPolicyExemptUntil)
    : null;

  const released =
    isPolicyCompliant(user.passwordPolicyVersion) ||
    (exemptUntil !== null && Date.now() < exemptUntil.getTime());

  if (!released) {
    return null;
  }

  await createSession(user.id, { policyCompliant: true });

  // Dashboard rather than defaultMenu: it resolves the user's landing page
  // itself, so this stays a single query.
  return { destination: '/dashboard' };
}
