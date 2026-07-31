import type { Metadata } from 'next';

import { connection } from 'next/server';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import FormHeader from '@/components/custom/form-header';
import { FormLoader } from '@/components/custom/loaders';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { IssueMaterialForm } from '@/features/store/components/material-issues/issue-form';
import { getMaterialIssueNumber } from '@/features/store/services/issues/data';
import { getStores } from '@/features/store/services/stores/data';
import { transformOptions } from '@/lib/helpers/formatters';

export const metadata: Metadata = {
  title: 'New Material Issue',
};

export default function NewMaterialIssuePage() {
  return (
    <div className="space-y-6">
      <FormHeader
        title="Create New Material Issue"
        description="Create a new material issue."
      />
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the material issue form"
        loader={<FormLoader />}
      >
        <NewMaterialIssueContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function NewMaterialIssueContent() {
  await connection();
  const [stores, products, issueNo] = await Promise.all([
    getStores(),
    getSelectableProducts(),
    getMaterialIssueNumber(),
  ]);

  return (
    <IssueMaterialForm
      defaultIssueDate={new Date().toISOString()}
      products={products}
      stores={transformOptions(
        stores.map(s => ({ id: s.id, name: s.storeName.toUpperCase() }))
      )}
      issueNo={issueNo}
    />
  );
}
