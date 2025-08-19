import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { Metadata } from 'next';
import PageHeader from '@/components/custom/page-header';
import { TableSkeleton } from '@/components/custom/table-skeleton';
import Search from '@/components/custom/search';
import { RequisitionsDataTable } from '@/features/procurement/components/material-requisitions/requisitions-datatable';
import { getMaterialRequisitions } from '@/features/procurement/services/material-requisitions/data';

export const metadata: Metadata = {
  title: 'Material Requisition',
};

export default async function MaterialRequisitionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Requisition"
        path="/procurement/material-requisition/new"
        description="Create and manage material requisitions for procurement."
      />
      <Search placeholder="Search requisitions..." />
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <Suspense
          fallback={
            <TableSkeleton
              columnWidths={['w-24', 'w-24', 'w-56', 'w-1']}
              rowCount={10}
            />
          }
        >
          <SuspendedComponent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

async function SuspendedComponent() {
  const requisitions = await getMaterialRequisitions();
  return <RequisitionsDataTable data={requisitions} />;
}
