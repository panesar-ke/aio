import type { Metadata } from 'next';

import PageHeader from '@/components/custom/page-header';
import { BackButton } from '@/components/ui/back-button';
import { AssetPage } from '@/features/it/assets/components/asset-page';
import {
  getAssetFormDependencies,
  getAssignableAssets,
  getAssignableUsers,
} from '@/features/it/assets/services/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'IT Asset Registry',
};

export default async function ITAssetRegistryPage() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const [{ categories, departments }, users, assets] = await Promise.all([
    getAssetFormDependencies(),
    getAssignableUsers(),
    getAssignableAssets(),
  ]);

  return (
    <div className="space-y-6">
      <BackButton variant="link">Go Back</BackButton>
      <PageHeader
        title="IT Asset Registry"
        description="Track all IT assets and their operational state"
        path="/it/assets/registry/new"
        buttonText="Create Asset"
      />
      <AssetPage
        categories={categories}
        departments={departments}
        assignableUsers={users}
        assignableAssets={assets}
      />
    </div>
  );
}
