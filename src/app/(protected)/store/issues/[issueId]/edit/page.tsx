import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import FormHeader from '@/components/custom/form-header';
import { getStores } from '@/features/store/services/stores/data';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { IssueMaterialForm } from '@/features/store/components/material-issues/issue-form';
import { transformOptions } from '@/lib/helpers/formatters';
import { getMaterialIssue } from '@/features/store/services/issues/data';

export const metadata: Metadata = {
  title: 'Edit Material Issue',
};

export default function EditMaterialIssuePage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  return (
    <div className="space-y-6">
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the material issue"
        loader={<FormLoader />}
      >
        <EditMaterialIssueContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function EditMaterialIssueContent({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const { issueId } = await params;
  const [stores, products, issue] = await Promise.all([
    getStores(),
    getSelectableProducts(),
    getMaterialIssue(issueId),
  ]);

  if (!issue) return notFound();

  return (
    <>
      <FormHeader
        title="Edit Material Issue"
        description="Edit the material issue details."
      />
      <IssueMaterialForm
        products={products}
        stores={transformOptions(
          stores.map(s => ({ id: s.id, name: s.storeName.toUpperCase() }))
        )}
        issueNo={issue.issueNo}
        issue={issue}
      />
    </>
  );
}
