import type z from 'zod';

import type { getActiveSessions } from '@/features/admin/services/data';
import type {
  cloneUserRightsFormSchema,
  policyExemptionFormSchema,
  resetPasswordFormSchema,
  userRightsFormSchema,
  userSchema,
} from '@/features/admin/utils/schema';

export type UserRightsFormValue = z.infer<typeof userRightsFormSchema>;
export type CloneUserRightsFormValues = z.infer<
  typeof cloneUserRightsFormSchema
>;

export type AdminCacheTag = 'forms' | 'users' | 'active-sessions';
export type User = z.infer<typeof userSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
export type PolicyExemptionFormValues = z.infer<
  typeof policyExemptionFormSchema
>;

export type ActiveSession = Awaited<
  ReturnType<typeof getActiveSessions>
>[number];
