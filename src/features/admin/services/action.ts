'use server';

import { revalidateTag } from 'next/cache';
import db from '@/drizzle/db';
import { userRights } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getUserFormsGlobalTag } from '@/features/admin/utils/cache';
import type { UserRightsFormValue } from '@/features/admin/utils/admin.types';
import { validateFields } from '@/lib/action-validator';
import { userRightsFormSchema } from '../utils/schema';

export async function updateUserRights(values: unknown) {
  const { data, error } = validateFields<UserRightsFormValue>(
    values,
    userRightsFormSchema
  );
  if (error !== null) {
    return {
      error: true,
      message: 'Validation failed! Confirm your input.',
    };
  }
  try {
    const { userId, rights } = data;

    await db.transaction(async tx => {
      await tx.delete(userRights).where(eq(userRights.userId, userId));

      const rightsToInsert = rights
        .filter(right => right.hasAccess)
        .map(right => ({
          userId,
          formId: right.formId,
        }));

      if (rightsToInsert.length > 0) {
        await tx.insert(userRights).values(rightsToInsert);
      }
    });

    revalidateTag(getUserFormsGlobalTag(userId));

    return {
      error: false,
      message: 'User rights updated successfully',
    };
  } catch (error) {
    console.error('Error updating user rights:', error);
    return {
      error: true,
      message: 'Failed to update user rights',
    };
  }
}
