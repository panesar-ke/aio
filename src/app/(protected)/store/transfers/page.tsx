import type { Metadata } from 'next';
import PageHeader from '@/components/custom/page-header';
import { getTransfers } from '@/features/store/services/transfers/data';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { TransfersDatatable } from '@/features/store/components/transfers/transfer-datatable';

export const metadata: Metadata = {
  title: 'Transfers',
};
export default async function TransfersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Transfers"
        description="View and manage stock transfers."
        path="/store/transfers/new"
      />
      <ErrorBoundaryWithSuspense
        loaderType="tableOnly"
        errorMessage="Failed to load transfers"
      >
        <SuspendedTransfers />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedTransfers() {
  const transfers = await getTransfers();
  return <TransfersDatatable data={transfers} />;
}
