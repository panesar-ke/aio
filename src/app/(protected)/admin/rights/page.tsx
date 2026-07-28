import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import { RightsForm } from '@/features/admin/components/rights/rights-form';
import { getForms, getUsers } from '@/features/admin/services/data';
import { transformOptions } from '@/lib/helpers/formatters';
import { requirePermission } from '@/lib/permissions/guards';

export const metadata = {
  title: 'User rights',
};

export default function UserRightsPage() {
  return (
    <div className="space-y-6">
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while loading user rights"
        loader={<FormLoader />}
      >
        <UserRightsContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function UserRightsContent() {
  await requirePermission('admin:admin', { mode: 'page' });

  const [forms, users] = await Promise.all([getForms(), getUsers()]);
  return (
    <RightsForm
      forms={forms}
      users={transformOptions(
        users
          .filter(u => u.active && u.userType === 'STANDARD USER')
          .map(user => ({ id: user.id, name: user.name.toUpperCase() }))
      )}
    />
  );
}
