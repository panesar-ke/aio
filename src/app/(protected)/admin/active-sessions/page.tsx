import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { ClientActiveSessionsPage } from '@/features/admin/components/active-sessions/active-sessions-page';
import { getActiveSessions } from '@/features/admin/services/data';
import { loadActiveSessionsSearchParams } from '@/features/admin/utils/search-params';
import { requirePermission } from '@/lib/permissions/guards';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Active Sessions',
};

export default async function ActiveSessionsPage({
  searchParams,
}: Pick<PageProps<'/admin/active-sessions'>, 'searchParams'>) {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Active Sessions'
        description='Monitor and manage active logins across every user in the organization.'
      />
      <ErrorBoundaryWithSuspense loaderType='tableOnly'>
        <SuspendedActiveSessionsPage searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedActiveSessionsPage({
  searchParams,
}: Pick<PageProps<'/admin/active-sessions'>, 'searchParams'>) {
  await requirePermission('admin:admin', { mode: 'page' });
  const { search } = await loadActiveSessionsSearchParams(searchParams);
  const { session } = await getCurrentUser('page');
  const sessions = await getActiveSessions(search);

  return <ClientActiveSessionsPage sessions={sessions} session={session} />;
}
