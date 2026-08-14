'use server';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import type {
  ApiFailureWithoutData,
  ApiSuccessWithoutData,
} from '@/types/index.types';

import db from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { env } from '@/env/server';
import { verifyPassword } from '@/features/auth/utils/password';
import {
  type ChangePasswordFormValues,
  changePasswordSchema,
} from '@/features/change-password/utils/schema';
import { validateFields } from '@/lib/action-validator';
import { getCurrentUser } from '@/lib/session';

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
      user.password
    );

    if (!verification.ok) {
      return {
        error: true,
        message: 'Current password is incorrect.',
      };
    }

    const saltRounds = Number(env.BCRYPT_ROUNDS);
    const hashedNewPassword = await bcrypt.hash(data.newPassword, saltRounds);

    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        promptPasswordChange: false,
      })
      .where(eq(users.id, currentUser.id));

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
