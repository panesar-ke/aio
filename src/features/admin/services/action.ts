'use server';

import { revalidateTag } from 'next/cache';
import { eq, and, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type {
  CloneUserRightsFormValues,
  User,
  UserRightsFormValue,
} from '@/features/admin/utils/admin.types';
import type { ApiFailureWithoutData } from '@/types/index.types';
import { userRights, users } from '@/drizzle/schema';
import db from '@/drizzle/db';
import {
  getUserFormsGlobalTag,
  revalidateUserTags,
} from '@/features/admin/utils/cache';
import { validateFields } from '@/lib/action-validator';
import {
  cloneUserRightsFormSchema,
  userRightsFormSchema,
  userSchema,
} from '@/features/admin/utils/schema';
import { getCurrentUser } from '@/lib/session';
import { env } from '@/env/server';
import { inngest } from '@/inngest/client';
import {
  internationalizePhoneNumber,
  titleCase,
} from '@/lib/helpers/formatters';
import { redirect } from 'next/navigation';
import { generatePassword } from '@/features/admin/utils/helpers';

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

    await db
      .insert(userRights)
      .values(rightsToClone)
      .onConflictDoNothing({ target: [userRights.userId, userRights.formId] });

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

export const upsertUser = async (values: unknown) => {
  const user = await getCurrentUser();

  if (user.userType === 'STANDARD USER') {
    return {
      error: true,
      message: 'You do not have permission to perform this action',
    };
  }

  const { data, error } = validateFields<User>(values, userSchema);

  if (error !== null) {
    return {
      error: true,
      message: 'Validation failed! Confirm your input.',
    };
  }

  const { id, name, contact, email, userType, active } = data;
  console.log(id);

  const password = generatePassword(8);
  const hashedPassword = await bcrypt.hash(password, Number(env.BCRYPT_ROUNDS));

  try {
    const contactExists = await db.query.users.findFirst({
      columns: { id: true },
      where: and(eq(users.contact, contact), id ? ne(users.id, id) : undefined),
    });

    if (contactExists) {
      return {
        error: true,
        message: 'Contact already exists',
      };
    }

    const [{ id: userId }] = await db
      .insert(users)
      .values({
        id: id ?? undefined,
        name,
        password: hashedPassword,
        contact,
        email,
        userType,
        active: true,
        promptPasswordChange: true,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name,
          contact,
          email,
          userType,
          active,
        },
      })
      .returning({ id: users.id });

    if (!id) {
      await inngest.send({
        name: 'user/send.new.password',
        data: {
          contact: internationalizePhoneNumber(contact, true),
          password,
          name: titleCase(name.split(' ')[0]),
        },
      });
    }

    revalidateUserTags(userId);
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      error: true,
      message: `Failed to ${id ? 'update' : 'create'} user!`,
    };
  }
  return redirect('/admin/users');
};
