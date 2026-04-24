import 'server-only';

import { cache } from 'react';
import { eq } from 'drizzle-orm';
import db from '@/drizzle/db';
import { permissions as userPermissions } from '@/drizzle/schema';
import { getCurrentUserOrNull } from '@/lib/session';
import {
  PERMISSIONS,
  isPermission,
  type Permission,
} from '@/lib/permissions/catalog';

const ADMIN_USER_TYPES = new Set(['ADMIN', 'SUPER ADMIN']);

export const getUserAssignedPermissions = cache(
  async (userId: string): Promise<Array<Permission>> => {
    const rows = await db
      .select({ permission: userPermissions.permission })
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    return rows
      .map(row => row.permission)
      .filter((permission): permission is Permission =>
        isPermission(permission)
      );
  }
);

export const getCurrentUserPermissions = cache(async (): Promise<
  Set<Permission>
> => {
  const user = await getCurrentUserOrNull();

  if (!user) {
    return new Set();
  }

  if (ADMIN_USER_TYPES.has(user.userType)) {
    return new Set(PERMISSIONS);
  }

  return new Set(await getUserAssignedPermissions(user.id));
});

export async function hasPermission(permission: Permission): Promise<boolean> {
  const permissions = await getCurrentUserPermissions();
  return permissions.has(permission);
}

export async function hasAnyPermission(
  permissions: Array<Permission>
): Promise<boolean> {
  const currentPermissions = await getCurrentUserPermissions();
  return permissions.some(permission => currentPermissions.has(permission));
}

export function normalizePermissions(
  permissions: Array<Permission>
): Array<Permission> {
  return Array.from(new Set(permissions));
}
