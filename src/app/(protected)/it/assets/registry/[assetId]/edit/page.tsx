import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import { AssetForm } from '@/features/it/assets/components/asset-form';
import {

  getAssetById,
  getAssetFormDependencies,
} from '@/features/it/assets/services/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Edit IT Asset',
};

type Params = Promise<{ assetId: string }>;

export default function EditAssetPage({ params }: { params: Params }) {
  return (
    <div className="container max-w-3xl mx-auto p-4">
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while loading the asset"
        loader={<FormLoader />}
      >
        <EditAssetContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function EditAssetContent({ params }: { params: Params }) {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const { assetId } = await params;

  const [{ categories, departments, vendors }, asset] = await Promise.all([
    getAssetFormDependencies(),
    getAssetById(assetId),
  ]);

  return (
    <AssetForm
      categories={categories}
      departments={departments}
      vendors={vendors}
      initialValues={{
        id: asset.id,
        categoryId: asset.categoryId,
        name: asset.name,
        brand: asset.brand ?? '',
        model: asset.model ?? '',
        serialNumber: asset.serialNumber ?? '',
        specs: asset.specs ? JSON.stringify(asset.specs, null, 2) : '',
        purchaseDate: asset.purchaseDate ?? null,
        purchaseCost:
          asset.purchaseCost != null ? Number(asset.purchaseCost) : null,
        vendorId: asset.vendorId ?? '',
        warrantyExpiryDate: asset.warrantyExpiryDate ?? null,
        status: asset.status,
        condition: asset.condition,
        departmentId: asset.departmentId ? String(asset.departmentId) : '',
        notes: asset.notes ?? '',
      }}
    />
  );
}
