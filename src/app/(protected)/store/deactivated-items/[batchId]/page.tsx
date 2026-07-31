import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { BatchItemsDatatable } from '@/features/store/components/product-deactivation/batch-items-datatable';
import { getDeactivationBatch } from '@/features/store/services/product-deactivation/data';
import { requirePermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Deactivation Batch Details',
};

export default function DeactivationBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Deactivation Batch Details"
        description="Reactivate products that are still needed, or exclude them from future checks."
      />
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while fetching this deactivation batch."
        loaderType="full"
      >
        <SuspendedBatchDetail params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedBatchDetail({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  await requirePermission('store:admin', { mode: 'page' });

  const { batchId } = await params;
  const batch = await getDeactivationBatch(batchId);

  if (!batch) {
    notFound();
  }

  return <BatchItemsDatatable items={batch.items} />;
}
