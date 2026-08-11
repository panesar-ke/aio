import { hasPermission } from '@/lib/permissions/service';

export const isSaleAdmin = async () => {
  return await hasPermission('sales:admin');
};
