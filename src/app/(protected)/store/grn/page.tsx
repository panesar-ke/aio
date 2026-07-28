import type { Metadata } from 'next';
import type { SearchParams } from '@/types/index.types';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { getGrns } from '@/features/store/services/grns/data';
import { GrnsDatatable } from '@/features/store/components/grns/grns-datatable';

export const metadata: Metadata = {
  title: 'Goods received note',
};

export default function GoodsReceivedNotePage({
  searchParams,
}: SearchParams) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods received note"
        description="Manage and view goods received notes."
        path="/store/grn/new"
      />
      <Search placeholder="Search grns..." />
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while fetching GRNs."
        loaderType="tableOnly"
      >
        <SuspendedGrnsTable searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

const SuspendedGrnsTable = async ({
  searchParams,
}: {
  searchParams: SearchParams['searchParams'];
}) => {
  const { search } = await searchParams;
  const grns = await getGrns(search);
  return <GrnsDatatable grns={grns} />;
};
