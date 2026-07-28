import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { DatatableSkeleton } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import { UsersDatatable } from '@/features/admin/components/users/users-table';
import { getUsers } from '@/features/admin/services/data';
import { requirePermission } from '@/lib/permissions/guards';
import type { SearchParams } from '@/types/index.types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users',
};

export default function Users({ searchParams }: SearchParams) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Create and manage application users..."
        path="/admin/users/new"
      />
      <Search placeholder="Search users...." />
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while loading users"
        loader={<DatatableSkeleton />}
      >
        <SuspendedUsers searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedUsers({
  searchParams,
}: {
  searchParams: SearchParams['searchParams'];
}) {
  await requirePermission('admin:admin', { mode: 'page' });
  const { search } = await searchParams;
  const q = typeof search === 'string' ? search : undefined;
  const users = await getUsers(q);
  return <UsersDatatable users={users} />;
}
