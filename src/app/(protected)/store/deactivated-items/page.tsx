import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { BatchesDatatable } from '@/features/store/components/product-deactivation/batches-datatable';
import { getDeactivationBatches } from '@/features/store/services/product-deactivation/data';
import { requirePermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Deactivated Items',
};

export default function DeactivatedItemsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Deactivated Items"
        description="Review products automatically deactivated for lack of usage."
      />
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while fetching deactivation batches."
        loaderType="tableOnly"
      >
        <SuspendedBatchesTable />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedBatchesTable() {
  await requirePermission('store:admin', { mode: 'page' });

  const batches = await getDeactivationBatches();

  return <BatchesDatatable batches={batches} />;
}
