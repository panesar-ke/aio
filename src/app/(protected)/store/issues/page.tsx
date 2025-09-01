import type { Metadata } from 'next';
import type { SearchParams } from '@/types/index.types';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { getMaterialIssues } from '@/features/store/services/issues/data';
import { MaterialIssuesDatatable } from '@/features/store/components/material-issues/issues-datatable';

export const metadata: Metadata = {
  title: 'Material Issues',
};

export default async function MaterialIssuesPage({
  searchParams,
}: SearchParams) {
  const { search } = await searchParams;
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
        <SuspendedMaterialIssues search={search} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedMaterialIssues({ search }: { search?: string }) {
  const issues = await getMaterialIssues(search);
  return <MaterialIssuesDatatable data={issues} />;
}
