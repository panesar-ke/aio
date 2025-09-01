import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { getStores } from '@/features/store/services/stores/data';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { IssueMaterialForm } from '@/features/store/components/material-issues/issue-form';
import { transformOptions } from '@/lib/helpers/formatters';
import { getMaterialIssueNumber } from '@/features/store/services/issues/data';

export const metadata: Metadata = {
  title: 'New Material Issue',
};

export default async function NewMaterialIssuePage() {
  const [stores, products, issueNo] = await Promise.all([
    getStores(),
    getSelectableProducts(),
    getMaterialIssueNumber(),
  ]);
  return (
    <div className="space-y-6">
      <FormHeader
        title="Create New Material Issue"
        description="Create a new material issue."
      />
      <IssueMaterialForm
        products={products}
        stores={transformOptions(
          stores.map(s => ({ id: s.id, name: s.storeName.toUpperCase() }))
        )}
        issueNo={issueNo}
      />
    </div>
  );
}
