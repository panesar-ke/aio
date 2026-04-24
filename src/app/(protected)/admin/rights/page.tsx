import { RightsForm } from '@/features/admin/components/rights/rights-form';
import { getForms, getUsers } from '@/features/admin/services/data';
import { transformOptions } from '@/lib/helpers/formatters';
import { requirePermission } from '@/lib/permissions/guards';

export const metadata = {
  title: 'User rights',
};

export default async function UserRightsPage() {
  await requirePermission('admin:admin', { mode: 'page' });

  const [forms, users] = await Promise.all([getForms(), getUsers()]);
  // log
  return (
    <div className="space-y-6">
      <RightsForm
        forms={forms}
        users={transformOptions(
          users
            .filter(u => u.active && u.userType === 'STANDARD USER')
            .map(user => ({ id: user.id, name: user.name.toUpperCase() }))
        )}
      />
    </div>
  );
}
