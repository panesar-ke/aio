export const PERMISSIONS = [
  'admin:admin',
  'it:admin',
  'it:standard',
  'procurement:admin',
  'procurement:standard',
  'store:admin',
  'store:standard',
  'production:admin',
  'production:standard',
  'sales:admin',
  'sales:standard',
  'hr:admin',
  'hr:standard',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS = {
  'admin:admin': 'Admin - Admin',
  'it:admin': 'IT - Admin',
  'it:standard': 'IT - Standard',
  'procurement:admin': 'Procurement - Admin',
  'procurement:standard': 'Procurement - Standard',
  'store:admin': 'Store - Admin',
  'store:standard': 'Store - Standard',
  'production:admin': 'Production - Admin',
  'production:standard': 'Production - Standard',
  'hr:admin': 'Human Resources - Admin',
  'hr:standard': 'Human Resources - Standard',
  'sales:admin': 'Sales - Admin',
  'sales:standard': 'Sales - Standard',
} satisfies Record<Permission, string>;

export const PERMISSION_OPTIONS = PERMISSIONS.map(permission => ({
  value: permission,
  label: PERMISSION_LABELS[permission],
}));

export function isPermission(value: string): value is Permission {
  return PERMISSIONS.includes(value as Permission);
}
