import type { Metadata } from 'next';
import PageHeader from '@/components/custom/page-header';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { getGrn } from '@/features/store/services/grns/data';
import { GrnView } from '@/features/store/components/grns/grn-view';

export const metadata: Metadata = {
  title: 'View GRN Details',
};

export default async function ViewGrnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        <SuspendedGrnView id={id} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

const SuspendedGrnView = async ({ id }: { id: string }) => {
  const grn = await getGrn(id);

  return <GrnView grn={grn} />;
};
