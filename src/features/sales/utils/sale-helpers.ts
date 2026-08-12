import { requireAnyPermission } from '@/lib/permissions/guards';
import { hasPermission } from '@/lib/permissions/service';
import { getCurrentUser } from '@/lib/session';

export const isSaleAdmin = async () => {
  return await hasPermission('sales:admin');
};

export const saleUser = async () => {
  await requireAnyPermission(['sales:admin', 'sales:standard']);
  const user = await getCurrentUser('action');
  const isSalesAdmin = await isSaleAdmin();
  return { userId: user.id, isSalesAdmin };
};
