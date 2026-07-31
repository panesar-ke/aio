'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';

import type { Permission } from '@/lib/permissions/catalog';

const PermissionContext = createContext<Set<Permission> | null>(null);

export function PermissionProvider({
  children,
  permissions,
}: {
  children: ReactNode;
  permissions: Array<Permission>;
}) {
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  return (
    <PermissionContext.Provider value={permissionSet}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionContext) ?? new Set<Permission>();
}

export function useHasAnyPermission(permissions: Array<Permission>) {
  const permissionSet = usePermissions();
  return permissions.some(permission => permissionSet.has(permission));
}
