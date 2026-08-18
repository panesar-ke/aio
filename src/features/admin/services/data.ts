'use cache';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';

import type { User } from '@/types/index.types';

import db from '@/drizzle/db';
import { forms, sessions, userRights, users } from '@/drizzle/schema';
import {
  getActiveSessionsGlobalTag,
  getFormsGlobalTag,
  getUserFormsGlobalTag,
  getUsersGlobalTag,
  getUserTag,
} from '@/features/admin/utils/cache';

export const getForms = async () => {
  cacheTag(getFormsGlobalTag());
  return await db.query.forms.findMany({
    columns: { id: true, formName: true, path: true, module: true },
    where: (forms, { eq }) => eq(forms.active, true),
    orderBy: (forms, { asc }) => [asc(forms.moduleId), asc(forms.menuOrder)],
  });
};

export const getUsers = async (q?: string) => {
  cacheTag(getUsersGlobalTag());
  return await db.query.users.findMany({
    columns: {
      password: false,
      contactVerified: false,
      defaultMenu: false,
    },
    where: q
      ? (users, { ilike, or }) =>
          or(
            ilike(users.name, `%${q}%`),
            ilike(users.email, `%${q}%`),
            ilike(users.contact, `%${q}%`),
            ilike(sql`CAST(${users.userType} AS TEXT)`, `%${q}%`),
          )
      : undefined,
    orderBy: (users, { asc }) => [asc(sql`lower(${users.name})`)],
  });
};

export const getUser = async (userId: string) => {
  cacheTag(getUserTag(userId));
  const user = await db.query.users.findFirst({
    columns: {
      password: false,
      contactVerified: false,
      defaultMenu: false,
    },
    where: (users, { eq }) => eq(users.id, userId),
  });

  if (!user) return notFound();
  return user;
};

export const getUserForms = async (
  userId: string,
  userType: User['userType'],
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

export async function getActiveSessions(search?: string) {
  cacheTag(getActiveSessionsGlobalTag());

  return db
    .select({
      id: sessions.id,
      userId: sessions.userId,
      userName: users.name,
      userEmail: users.email,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
      lastActivityAt: sessions.lastActivityAt,
      ipAddress: sessions.ipAddress,
      userAgent: sessions.userAgent,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        sql`${sessions.expiresAt} > now()`,
        search
          ? or(
              ilike(users.name, `%${search}%`),
              ilike(users.email, `%${search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(sql`${sessions.lastActivityAt} desc nulls last`);
}
