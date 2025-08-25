'use server';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import db from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { getCurrentUser } from '@/lib/session';
import { validateFields } from '@/lib/action-validator';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/change-password/utils/schema';
import type {
  ApiFailureWithoutData,
  ApiSuccessWithoutData,
} from '@/types/index.types';
import { env } from '@/env/server';

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

    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
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
