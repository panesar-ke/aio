import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import { AssetForm } from '@/features/it/assets/components/asset-form';
import { getAssetFormDependencies } from '@/features/it/assets/services/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'New IT Asset',
};

export default function NewAssetPage() {
  return (
    <div className="container max-w-3xl mx-auto p-4">
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while loading the asset form"
        loader={<FormLoader />}
      >
        <NewAssetContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function NewAssetContent() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const { categories, departments, vendors } = await getAssetFormDependencies();

  return (
    <AssetForm
      categories={categories}
      departments={departments}
      vendors={vendors}
    />
  );
}
