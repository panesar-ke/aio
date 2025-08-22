'use server';

import { revalidateTag } from 'next/cache';
import { eq } from 'drizzle-orm';
import type {
  CloneUserRightsFormValues,
  UserRightsFormValue,
} from '@/features/admin/utils/admin.types';
import type { ApiFailureWithoutData } from '@/types/index.types';
import { userRights } from '@/drizzle/schema';
import db from '@/drizzle/db';
import { getUserFormsGlobalTag } from '@/features/admin/utils/cache';
import { validateFields } from '@/lib/action-validator';
import {
  cloneUserRightsFormSchema,
  userRightsFormSchema,
} from '@/features/admin/utils/schema';

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

export const cloneUserRights = async (values: unknown) => {
  const { data, error } = validateFields<CloneUserRightsFormValues>(
    values,
    cloneUserRightsFormSchema
  );
  if (error !== null) {
    return {
      error: true,
      message: 'Validation failed! Confirm your input.',
    } satisfies ApiFailureWithoutData;
  }

  try {
    const { cloningFrom, cloningTo } = data;

    const userFromRights = await db
      .select()
      .from(userRights)
      .where(eq(userRights.userId, cloningFrom));

    if (userFromRights.length === 0) {
      return {
        error: true,
        message: 'No rights found to clone',
      };
    }

    const rightsToClone = userFromRights.map(right => ({
      userId: cloningTo,
      formId: right.formId,
    }));

    await db.insert(userRights).values(rightsToClone);

    revalidateTag(getUserFormsGlobalTag(cloningTo));

    return {
      error: false,
      message: 'User rights cloned successfully',
    };
  } catch (error) {
    console.error('Error cloning user rights:', error);
    return {
      error: true,
      message: 'Failed to clone user rights',
    };
  }
};
