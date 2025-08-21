import z from 'zod';
import { userRightsFormSchema } from '@/features/admin/utils/schema';

export type UserRightsFormValue = z.infer<typeof userRightsFormSchema>;

export type AdminCacheTag = 'forms';
