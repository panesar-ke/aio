import { z } from 'zod';

import { requiredTrimmedStringSchemaEntry } from '@/lib/schema-rules';

export const changePasswordSchema = z
  .object({
    currentPassword: requiredTrimmedStringSchemaEntry(
      'Current password is required'
    ),
    newPassword: requiredTrimmedStringSchemaEntry(
      'New password is required'
    ).min(8, 'New password must be at least 8 characters long'),
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

    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New password must be different from current password',
        path: ['newPassword'],
      });
    }
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
