'use cache';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { and, asc, eq } from 'drizzle-orm';
import {
  getFormsGlobalTag,
  getUserFormsGlobalTag,
  getUsersGlobalTag,
} from '@/features/admin/utils/cache';
import db from '@/drizzle/db';

import { User } from '@/types/index.types';
import { forms, userRights } from '@/drizzle/schema';

export const getForms = async () => {
  cacheTag(getFormsGlobalTag());
  return await db.query.forms.findMany({
    columns: { id: true, formName: true, path: true, module: true },
    where: (forms, { eq }) => eq(forms.active, true),
    orderBy: (forms, { asc }) => [asc(forms.moduleId), asc(forms.menuOrder)],
  });
};

export const getUsers = async () => {
  cacheTag(getUsersGlobalTag());
  return await db.query.users.findMany({
    columns: {
      password: false,
      contactVerified: false,
      defaultMenu: false,
      promptPasswordChange: false,
      resetToken: false,
    },
    orderBy: (users, { asc }) => [asc(users.name)],
  });
};

export const getUserForms = async (
  userId: string,
  userType: User['userType']
) => {
  cacheTag(getUserFormsGlobalTag(userId));

  if (userType === 'STANDARD USER') {
    return db
      .select({
        id: forms.id,
        formName: forms.formName,
        path: forms.path,
        module: forms.module,
      })
      .from(forms)
      .innerJoin(userRights, eq(userRights.formId, forms.id))
      .where(and(eq(userRights.userId, userId), eq(forms.active, true)))
      .orderBy(asc(forms.moduleId), asc(forms.menuOrder));
  }

  return await db.query.forms.findMany({
    columns: { id: true, formName: true, path: true, module: true },
    where: (forms, { eq }) => eq(forms.active, true),
    orderBy: (forms, { asc }) => [asc(forms.moduleId), asc(forms.menuOrder)],
  });
};
