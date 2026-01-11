import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { DatatableSkeleton } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import { UsersDatatable } from '@/features/admin/components/users/users-table';
import { getUsers } from '@/features/admin/services/data';
import type { SearchParams } from '@/types/index.types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users',
};

export default async function Users({ searchParams }: SearchParams) {
  const { search } = await searchParams;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Create and manage users application users..."
        path="/admin/users/new"
      />
      <Search placeholder="Search users...." />
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while loading users"
        loader={<DatatableSkeleton />}
      >
        <SuspensedUsers q={search} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspensedUsers({ q }: { q?: string }) {
  const users = await getUsers(q);
  return <UsersDatatable users={users} />;
}
