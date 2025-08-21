'use cache';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { getCurrentUser } from '@/lib/session';
import { getFormsGlobalTag } from '@/features/admin/utils/cache';
import db from '@/drizzle/db';

export const getUserForms = async () => {
  const user = await getCurrentUser();
  cacheTag(getFormsGlobalTag(user.id));
  if (user.userType === 'ADMIN') {
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
