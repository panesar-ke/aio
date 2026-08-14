import { z } from 'zod';

import {
  requiredStringSchemaEntry,
  requiredTrimmedStringSchemaEntry,
} from '@/lib/schema-rules';

export const loginSchema = z.object({
  userName: requiredStringSchemaEntry('Email/contact is required'),
  password: requiredTrimmedStringSchemaEntry('Password is required').min(
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
    newPassword: requiredTrimmedStringSchemaEntry(
      'New password is required'
    ).min(8, 'Password must be at least 8 characters long'),
    confirmPassword: requiredTrimmedStringSchemaEntry(
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
