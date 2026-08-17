'use server';

import { and, eq, gte, isNull } from 'drizzle-orm';

import type { ActionResult } from '@/lib/actions/types';

import db from '@/drizzle/db';
import { passwordResetTokens, sessions, users } from '@/drizzle/schema';
import { env } from '@/env/server';
import { hashPassword } from '@/features/admin/utils/helpers';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/features/auth/actions/schema';
import { findValidResetToken } from '@/features/auth/services/data';
import {
  checkPasswordPolicy,
  CURRENT_POLICY_VERSION,
  policyFailureMessage,
} from '@/features/auth/utils/password-policy';
import {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_REQUEST_LIMIT,
  resetRequestWindowStart,
  resetTokenExpiry,
} from '@/features/auth/utils/reset-token';
import { ActionError, parseOrFail, runAction } from '@/lib/actions/safe-action';
import { sendPasswordResetEmail } from '@/lib/resend';

/**
 * The one thing `/forgot-password` ever says. The form is unauthenticated, so
 * any outcome-specific reply — unknown account, deactivated, no email on file,
 * throttled, send failed — lets anyone probe an email or phone number and learn
 * whether it belongs to a real, active account. Everything actionable is logged
 * server-side instead.
 */
const RESET_REQUEST_RESPONSE =
  'If that account exists, a reset link is on its way. Check your inbox.';

/**
 * Issues a reset link, or quietly does nothing when the request cannot be
 * honoured. Never throws for a caller-visible reason: the action above answers
 * identically either way.
 */
async function issueResetLink(identifier: string) {
  const user = await db.query.users.findFirst({
    columns: { id: true, name: true, email: true, active: true },
    where: (users, { eq, or }) =>
      or(eq(users.email, identifier), eq(users.contact, identifier)),
  });

  if (!user || !user.active || !user.email) {
    return;
  }

  const now = new Date();
  const windowStart = resetRequestWindowStart(now);

  const recent = await db.query.passwordResetTokens.findMany({
    columns: { id: true },
    where: and(
      eq(passwordResetTokens.userId, user.id),
      gte(passwordResetTokens.createdAt, windowStart),
    ),
  });

  if (recent.length >= RESET_TOKEN_REQUEST_LIMIT) {
    console.warn('Password reset throttled', { userId: user.id });
    return;
  }

  const token = generateResetToken();

  const { id: tokenId } = await db.transaction(async (tx) => {
    // Supersede any outstanding link so only the newest one works.
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    const [inserted] = await tx
      .insert(passwordResetTokens)
      .values({
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: resetTokenExpiry(now),
      })
      .returning({ id: passwordResetTokens.id });

    return inserted;
  });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name.split(' ')[0],
      resetUrl: `${env.APP_URL}/reset-password/${token}`,
    });
  } catch (sendError) {
    console.error('Failed to send password reset email:', sendError);
    // Roll the token back so a failed send does not burn a throttle slot.
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, tokenId));
  }
}

export const requestPasswordResetAction = async (
  values: unknown,
): Promise<ActionResult> =>
  runAction('reset-password-request', async () => {
    const data = parseOrFail(forgotPasswordSchema, values);

    await issueResetLink(data.identifier);

    return { error: false, message: RESET_REQUEST_RESPONSE };
  });

export const resetPasswordAction = async (values: unknown) =>
  runAction('reset-password-action', async () => {
    const data = parseOrFail(resetPasswordSchema, values);

    const valid = await findValidResetToken(data.token);

    if (!valid) {
      throw new ActionError(
        'That reset link is invalid or has expired. Request a new one.',
      );
    }

    const user = await db.query.users.findFirst({
      columns: { name: true, email: true, contact: true, active: true },
      where: (table, { eq }) => eq(table.id, valid.userId),
    });

    if (!user) {
      throw new ActionError('That account no longer exists.');
    }

    // Re-checked here, not just at request time: an account deactivated during
    // the 30-minute link lifetime must not be able to redeem it.
    if (!user.active) {
      throw new ActionError('That account is not active. Contact IT.');
    }

    const failures = checkPasswordPolicy(data.newPassword, user);

    if (failures.length > 0) {
      throw new ActionError(policyFailureMessage(failures[0]));
    }

    const hashedPassword = await hashPassword(data.newPassword);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          password: hashedPassword,
          passwordPolicyVersion: CURRENT_POLICY_VERSION,
          passwordChangedAt: now,
        })
        .where(eq(users.id, valid.userId));

      await tx
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(
          and(
            eq(passwordResetTokens.userId, valid.userId),
            isNull(passwordResetTokens.usedAt),
          ),
        );

      // The revocation: getCurrentUserOrNull requires a live session row, so
      // dropping them here invalidates every cookie issued before the reset.
      // Recovering an account must lock out whoever else was already in it.
      await tx.delete(sessions).where(eq(sessions.userId, valid.userId));
    });

    return {
      error: false,
      message: 'Password updated. Sign in with your new password.',
    };
  });
