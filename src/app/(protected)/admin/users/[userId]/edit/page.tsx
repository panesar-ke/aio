import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import { Button } from '@/components/ui/button';
import { UserForm } from '@/features/admin/components/users/user-form';
import { getUser } from '@/features/admin/services/data';
import { requirePermission } from '@/lib/permissions/guards';
import { getUserAssignedPermissions } from '@/lib/permissions/service';
import Link from 'next/link';

export const metadata = {
  title: 'Edit User',
};

export default function EditUser({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  return (
    <div className="space-y-6">
      <Button variant="secondary" size="sm" asChild>
        <Link href="/admin/users" prefetch={false}>
          &larr; Back to users
        </Link>
      </Button>
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while loading the user"
        loader={<FormLoader />}
      >
        <EditUserContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function EditUserContent({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requirePermission('admin:admin', { mode: 'page' });

  const { userId } = await params;
  const [user, permissions] = await Promise.all([
    getUser(userId),
    getUserAssignedPermissions(userId),
  ]);

  return (
    <UserForm
      user={{
        id: user.id,
        active: user.active,
        contact: user.contact,
        email: user.email!,
        name: user.name.toUpperCase(),
        permissions,
        userType: user.userType,
      }}
    />
  );
}
