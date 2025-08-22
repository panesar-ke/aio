import { RightsForm } from '@/features/admin/components/rights/rights-form';
import { getForms, getUsers } from '@/features/admin/services/data';
import { transformOptions } from '@/lib/helpers/formatters';

export const metadata = {
  title: 'User rights',
};

export default async function UserRightsPage() {
  const [forms, users] = await Promise.all([getForms(), getUsers()]);
  return (
    <div className="space-y-6">
      <RightsForm
        forms={forms}
        users={transformOptions(
          users
            .filter(u => u.active)
            .map(user => ({ id: user.id, name: user.name.toUpperCase() }))
        )}
      />
    </div>
  );
}
