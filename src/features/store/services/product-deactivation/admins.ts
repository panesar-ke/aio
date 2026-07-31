import { eq, inArray, or } from 'drizzle-orm';

import db from '@/drizzle/db';
import { permissions, users } from '@/drizzle/schema';
import { ADMIN_USER_TYPES } from '@/lib/permissions/service';

export async function getStoreAdminUserIds(): Promise<Array<string>> {
  const rows = await db
    .selectDistinct({ id: users.id })
    .from(users)
    .leftJoin(permissions, eq(permissions.userId, users.id))
    .where(
      or(
        eq(permissions.permission, 'store:admin'),
        inArray(
          users.userType,
          Array.from(ADMIN_USER_TYPES) as Array<'ADMIN' | 'SUPER ADMIN'>,
        ),
      ),
    );

  return rows.map(row => row.id);
}
