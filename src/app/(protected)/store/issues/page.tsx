import type { Metadata } from 'next';

import type { SearchParams } from '@/types/index.types';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import { MaterialIssuesDatatable } from '@/features/store/components/material-issues/issues-datatable';
import { getMaterialIssues } from '@/features/store/services/issues/data';

export const metadata: Metadata = {
  title: 'Material Issues',
};

export default function MaterialIssuesPage({
  searchParams,
}: SearchParams) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Issues"
        description="Manage and view store material issues"
        path="/store/issues/new"
      />
      <Search placeholder="Search material issues" />
      <ErrorBoundaryWithSuspense
        loaderType="tableOnly"
        errorMessage="There was a problem rendering list of material issues"
      >
        <SuspendedMaterialIssues searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedMaterialIssues({
  searchParams,
}: {
  searchParams: SearchParams['searchParams'];
}) {
  const { search } = await searchParams;
  const issues = await getMaterialIssues(search);
  return <MaterialIssuesDatatable data={issues} />;
}
