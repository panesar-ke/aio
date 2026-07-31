import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { GrnView } from '@/features/store/components/grns/grn-view';
import { getGrn } from '@/features/store/services/grns/data';

export const metadata: Metadata = {
  title: 'View GRN Details',
};

export default function ViewGrnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="GRN Details"
        description="View goods received note details."
      />
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while fetching GRN details."
        loaderType="full"
      >
        <SuspendedGrnView params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

const SuspendedGrnView = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const grn = await getGrn(id);

  return <GrnView grn={grn} />;
};
