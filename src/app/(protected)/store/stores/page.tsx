import type { Metadata } from 'next';
import type { SearchParams } from '@/types/index.types';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { getStores } from '@/features/store/services/stores/data';
import { StoresDatatable } from '@/features/store/components/stores/stores-datatable';

export const metadata: Metadata = {
  title: 'Stores',
};

export default function StoresPage({ searchParams }: SearchParams) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stores"
        description="Manage your stores here"
        path="/store/stores/new"
      />
      <Search placeholder="Search stores..." />
      <ErrorBoundaryWithSuspense
        errorMessage="Problem getting stores"
        loaderType="tableOnly"
      >
        <SuspendedStoresTable searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

const SuspendedStoresTable = async ({
  searchParams,
}: {
  searchParams: SearchParams['searchParams'];
}) => {
  const { search } = await searchParams;
  const stores = await getStores(search);
  return <StoresDatatable stores={stores} />;
};
