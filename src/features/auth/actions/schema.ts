import { z } from 'zod';

import { MIN_PASSWORD_LENGTH } from '@/features/auth/utils/password-policy';
import {
  requiredPasswordSchemaEntry,
  requiredStringSchemaEntry,
  requiredTrimmedStringSchemaEntry,
} from '@/lib/schema-rules';

export const loginSchema = z.object({
  userName: requiredStringSchemaEntry('Email/contact is required'),
  password: requiredPasswordSchemaEntry('Password is required').min(
    6,
    'Password must be at least 6 characters long'
  ),
});

export const forgotPasswordSchema = z.object({
  identifier: requiredStringSchemaEntry('Email or contact is required'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: requiredTrimmedStringSchemaEntry('Reset token is missing'),
    newPassword: requiredPasswordSchemaEntry('New password is required').min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    ),
    confirmPassword: requiredPasswordSchemaEntry(
      'Password confirmation is required'
    ),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
