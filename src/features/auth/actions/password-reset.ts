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
import { maskEmail } from '@/features/auth/utils/mask-email';
import {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_REQUEST_LIMIT,
  resetRequestWindowStart,
  resetTokenExpiry,
} from '@/features/auth/utils/reset-token';
import { ActionError, parseOrFail, runAction } from '@/lib/actions/safe-action';
import { sendPasswordResetEmail } from '@/lib/resend';

export const requestPasswordResetAction = async (
  values: unknown,
): Promise<ActionResult<string>> =>
  runAction('reset-password-request', async () => {
    const data = parseOrFail(forgotPasswordSchema, values);

    const user = await db.query.users.findFirst({
      columns: { id: true, name: true, email: true, active: true },
      where: (users, { eq, or }) =>
        or(
          eq(users.email, data.identifier),
          eq(users.contact, data.identifier),
        ),
    });

    if (!user) {
      throw new ActionError('No account found for that email or contact.');
    }

    if (!user.active) {
      throw new ActionError('That account is deactivated. Contact IT.');
    }

    if (!user.email) {
      throw new ActionError(
        'No email address on file for that account. Contact IT.',
      );
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
      throw new ActionError('Too many reset requests. Try again in an hour.');
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

      throw new ActionError(
        'Could not send the reset email. Try again shortly.',
      );
    }

    const maskedEmail = maskEmail(user.email);

    return {
      error: false,
      message: `Reset link sent to ${maskedEmail}`,
      data: maskedEmail,
    };
  });

export const resetPasswordAction = (values: unknown) =>
  runAction('reset-password-action', async () => {
    const data = parseOrFail(resetPasswordSchema, values);

    const valid = await findValidResetToken(data.token);

    if (!valid) {
      throw new ActionError(
        'That reset link is invalid or has expired. Request a new one.',
      );
    }

    const hashedPassword = await hashPassword(data.newPassword);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ password: hashedPassword })
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

      // Bookkeeping only: session validity is currently derived from the JWT
      // alone (see getSession/getCurrentUserOrNull and src/proxy.ts), so
      // clearing these rows does not revoke an existing cookie. This becomes
      // load-bearing once session validation checks the sessions table.
      await tx.delete(sessions).where(eq(sessions.userId, valid.userId));
    });

    return {
      error: false,
      message: 'Password updated. Sign in with your new password.',
    };
  });
