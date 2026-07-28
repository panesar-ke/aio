import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { AuthedPageLoader } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import { BackButton } from '@/components/ui/back-button';
import { AssignmentsPage } from '@/features/it/assets/components/assignments-page';
import {

  getAssignableAssets,
  getAssignableDepartments,
  getAssignableUsers,
} from '@/features/it/assets/services/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'IT Asset Assignments',
};

export default function ITAssetAssignmentsPage() {
  return (
    <div className="space-y-6">
      <BackButton variant="link">Go Back</BackButton>
      <PageHeader
        title="Asset Assignments"
        description="Review active and completed assignment records"
      />
      <ErrorBoundaryWithSuspense loader={<AuthedPageLoader />}>
        <ITAssetAssignmentsContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function ITAssetAssignmentsContent() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const [assets, users, departments] = await Promise.all([
    getAssignableAssets(),
    getAssignableUsers(),
    getAssignableDepartments(),
  ]);

  return (
    <AssignmentsPage assets={assets} users={users} departments={departments} />
  );
}
