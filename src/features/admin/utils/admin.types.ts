import type z from 'zod';
import type {
  cloneUserRightsFormSchema,
  userRightsFormSchema,
  userSchema,
  resetPasswordFormSchema,
} from '@/features/admin/utils/schema';

export type UserRightsFormValue = z.infer<typeof userRightsFormSchema>;
export type CloneUserRightsFormValues = z.infer<
  typeof cloneUserRightsFormSchema
>;

export type AdminCacheTag = 'forms' | 'users';
export type User = z.infer<typeof userSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
