import { z } from 'zod';

import { MAX_LOGIN_IDENTIFIER_LENGTH } from '@/features/auth/utils/login-attempt-fields';
import { MIN_PASSWORD_LENGTH } from '@/features/auth/utils/password-policy';
import {
  requiredPasswordSchemaEntry,
  requiredStringSchemaEntry,
  requiredTrimmedStringSchemaEntry,
} from '@/lib/schema-rules';

export const loginSchema = z.object({
  // Bounded, unlike most identifiers in this app: every failed sign-in stores
  // this string in an indexed column, so an unbounded one breaks the insert
  // and with it the throttle — see login-attempt-fields.ts.
  userName: requiredStringSchemaEntry('Email/contact is required').max(
    MAX_LOGIN_IDENTIFIER_LENGTH,
    'Email/contact is too long'
  ),
  password: requiredPasswordSchemaEntry('Password is required').min(
    6,
    'Password must be at least 6 characters long'
  ),
});

export const forgotPasswordSchema = z.object({
  identifier: requiredStringSchemaEntry('Email or contact is required').max(
    MAX_LOGIN_IDENTIFIER_LENGTH,
    'Email or contact is too long'
  ),
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
