'use client';

import type { ReactNode } from 'react';
import type { Permission } from '@/lib/permissions/catalog';
import { usePermissions } from '@/components/auth/permission-provider';

type PermissionGateProps = {
  children: ReactNode;
  permissions: Array<Permission>;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  match?: 'any' | 'all';
};

export function PermissionGate({
  children,
  permissions,
  fallback = null,
  match = 'any',
}: PermissionGateProps) {
  const permissionSet = usePermissions();
  const allowed =
    match === 'all'
      ? permissions.every(permission => permissionSet.has(permission))
      : permissions.some(permission => permissionSet.has(permission));

  return allowed ? children : fallback;
}
