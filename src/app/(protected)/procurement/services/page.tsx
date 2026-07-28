import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ErrorBoundary } from 'react-error-boundary';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import { TableSkeleton } from '@/components/custom/table-skeleton';
import { getServices } from '@/features/procurement/services/services/data';
import { ServicesDataTable } from '@/features/procurement/components/services/services-datatable';

type SearchParams = Promise<{ search?: string }>;

export const metadata: Metadata = {
  title: 'Services',
};

export default function ServicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Create and Manage your services."
        path="/procurement/services/new"
      />
      <Search placeholder="Search services..." />
      <ErrorBoundary
        fallback={<div className="text-red-500">Failed to load services</div>}
      >
        <Suspense
          fallback={
            <TableSkeleton
              columnWidths={['w-72', 'w-12', 'w-1']}
              rowCount={10}
            />
          }
        >
          <SuspendedServices searchParams={searchParams} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

async function SuspendedServices({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { search } = await searchParams;
  const services = await getServices(search);
  return <ServicesDataTable services={services} />;
}
