import type { Metadata } from 'next';

import { AssetForm } from '@/features/it/assets/components/asset-form';
import { getAssetFormDependencies } from '@/features/it/assets/services/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'New IT Asset',
};

export default async function NewAssetPage() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const { categories, departments, vendors } = await getAssetFormDependencies();

  return (
    <div className="container max-w-3xl mx-auto p-4">
      <AssetForm
        categories={categories}
        departments={departments}
        vendors={vendors}
      />
    </div>
  );
}
