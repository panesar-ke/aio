import type z from 'zod';
import type {
  cloneUserRightsFormSchema,
  userRightsFormSchema,
} from '@/features/admin/utils/schema';

export type UserRightsFormValue = z.infer<typeof userRightsFormSchema>;
export type CloneUserRightsFormValues = z.infer<
  typeof cloneUserRightsFormSchema
>;

export type AdminCacheTag = 'forms' | 'users';
