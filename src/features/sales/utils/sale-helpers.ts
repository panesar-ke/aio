import { hasPermission } from '@/lib/permissions/service';
import { getCurrentUser } from '@/lib/session';

export const isSaleAdmin = async () => {
  return await hasPermission('sales:admin');
};

export const saleUser = async () => {
  const user = await getCurrentUser('action');
  const isAdmin = await isSaleAdmin();
  return { userId: user.id, isAdmin };
};
