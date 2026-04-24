import type { ReactNode } from 'react';
import type { Permission } from '@/lib/permissions/catalog';
import { getCurrentUserPermissions } from '@/lib/permissions/service';

type ServerPermissionGateProps = {
  children: ReactNode;
  permissions: Array<Permission>;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  match?: 'any' | 'all';
};

export async function ServerPermissionGate({
  children,
  permissions,
  fallback = null,
  match = 'any',
}: ServerPermissionGateProps) {
  const permissionSet = await getCurrentUserPermissions();
  const allowed =
    match === 'all'
      ? permissions.every(permission => permissionSet.has(permission))
      : permissions.some(permission => permissionSet.has(permission));

  return allowed ? children : fallback;
}
