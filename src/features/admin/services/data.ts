'use cache';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { getFormsGlobalTag } from '@/features/admin/utils/cache';
import db from '@/drizzle/db';

import { User } from '@/types/index.types';
export const getUserForms = async (
  userId: string,
  userType: User['userType']
) => {
  cacheTag(getFormsGlobalTag(userId));
  if (userType === 'ADMIN') {
    return await db.query.forms.findMany({
      columns: { id: true, formName: true, path: true, module: true },
      where: (forms, { eq }) => eq(forms.active, true),
      orderBy: (forms, { asc }) => [asc(forms.moduleId), asc(forms.menuOrder)],
    });
  }

  // TODO: refactor this
  return await db.query.forms.findMany({
    columns: { id: true, formName: true, path: true, module: true },
    where: (forms, { eq }) => eq(forms.active, true),
    orderBy: (forms, { asc }) => [asc(forms.moduleId), asc(forms.menuOrder)],
  });
};
