'use server';

import { and, eq, gte, isNull } from 'drizzle-orm';

import type {
  ApiFailureWithoutData,
  ApiSuccessWithoutData,
} from '@/types/index.types';

import db from '@/drizzle/db';
import { passwordResetTokens } from '@/drizzle/schema';
import { env } from '@/env/server';
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '@/features/auth/actions/schema';
import { maskEmail } from '@/features/auth/utils/mask-email';
import {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_REQUEST_LIMIT,
  resetRequestWindowStart,
  resetTokenExpiry,
} from '@/features/auth/utils/reset-token';
import { validateFields } from '@/lib/action-validator';
import { sendPasswordResetEmail } from '@/lib/resend';

export async function requestPasswordResetAction(
  values: unknown
): Promise<ApiSuccessWithoutData | ApiFailureWithoutData> {
  const { data, error } = validateFields<ForgotPasswordFormValues>(
    values,
    forgotPasswordSchema
  );

  if (error !== null) {
    return { error: true, message: 'Enter your email address or contact.' };
  }

  const user = await db.query.users.findFirst({
    columns: { id: true, name: true, email: true, active: true },
    where: (users, { eq, or }) =>
      or(eq(users.email, data.identifier), eq(users.contact, data.identifier)),
  });

  if (!user) {
    return { error: true, message: 'No account found for that email or contact.' };
  }

  if (!user.active) {
    return { error: true, message: 'That account is deactivated. Contact IT.' };
  }

  if (!user.email) {
    return {
      error: true,
      message: 'No email address on file for that account. Contact IT.',
    };
  }

  const now = new Date();
  const windowStart = resetRequestWindowStart(now);

  const recent = await db.query.passwordResetTokens.findMany({
    columns: { id: true },
    where: and(
      eq(passwordResetTokens.userId, user.id),
      gte(passwordResetTokens.createdAt, windowStart)
    ),
  });

  if (recent.length >= RESET_TOKEN_REQUEST_LIMIT) {
    return {
      error: true,
      message: 'Too many reset requests. Try again in an hour.',
    };
  }

  const token = generateResetToken();

  // Supersede any outstanding link so only the newest one works.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt)
      )
    );

  const [{ id: tokenId }] = await db
    .insert(passwordResetTokens)
    .values({
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: resetTokenExpiry(now),
    })
    .returning({ id: passwordResetTokens.id });

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

    return {
      error: true,
      message: 'Could not send the reset email. Try again shortly.',
    };
  }

  return {
    error: false,
    message: `Reset link sent to ${maskEmail(user.email)}`,
  };
}
