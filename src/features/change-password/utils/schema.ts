import { z } from 'zod';

import { MIN_PASSWORD_LENGTH } from '@/features/auth/utils/password-policy';
import { requiredPasswordSchemaEntry } from '@/lib/schema-rules';

export const changePasswordSchema = z
  .object({
    currentPassword: requiredPasswordSchemaEntry(
      'Current password is required'
    ),
    newPassword: requiredPasswordSchemaEntry('New password is required').min(
      MIN_PASSWORD_LENGTH,
      `New password must be at least ${MIN_PASSWORD_LENGTH} characters long`
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

    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New password must be different from current password',
        path: ['newPassword'],
      });
    }
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
