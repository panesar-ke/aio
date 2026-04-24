import { redirect } from 'next/navigation';

import type { Permission } from '@/lib/permissions/catalog';
import type { User } from '@/types/index.types';

import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { getCurrentUserPermissions } from '@/lib/permissions/service';
import { getCurrentUserOrNull } from '@/lib/session';

type GuardMode = 'action' | 'api' | 'page';

type GuardOptions = {
  mode?: GuardMode;
};

type PermissionContext = {
  id: string;
  userType: User['userType'];
};

async function getAuthenticatedUser(
  mode: GuardMode,
): Promise<PermissionContext> {
  const user = await getCurrentUserOrNull();

  if (!user) {
    if (mode === 'api' || mode === 'action') {
      throw new UnauthorizedError();
    }

    redirect('/login');
  }

  return {
    id: user.id,
    userType: user.userType,
  };
}

function handleForbidden(mode: GuardMode): never {
  if (mode === 'page') {
    redirect('/unauthorized');
  }

  throw new ForbiddenError();
}

async function requirePermissions(
  requiredPermissions: Array<Permission>,
  options?: GuardOptions,
): Promise<PermissionContext> {
  const mode = options?.mode ?? 'action';
  const user = await getAuthenticatedUser(mode);
  const currentPermissions = await getCurrentUserPermissions();
  const allowed = requiredPermissions.some(permission =>
    currentPermissions.has(permission),
  );

  if (!allowed) {
    handleForbidden(mode);
  }

  return user;
}

export async function requirePermission(
  permission: Permission,
  options?: GuardOptions,
): Promise<void> {
  await requirePermissions([permission], options);
}

export async function requireAnyPermission(
  permissions: Array<Permission>,
  options?: GuardOptions,
): Promise<void> {
  await requirePermissions(permissions, options);
}

export function withPermission<T extends Array<unknown>, R>(
  permission: Permission,
  action: (ctx: PermissionContext, ...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    const ctx = await requirePermissions([permission]);
    return action(ctx, ...args);
  };
}
