import type { Metadata } from 'next';

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

export default async function EditAssetPage({ params }: { params: Params }) {
  const { assetId } = await params;
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const [{ categories, departments, vendors }, asset] = await Promise.all([
    getAssetFormDependencies(),
    getAssetById(assetId),
  ]);

  return (
    <div className="container max-w-3xl mx-auto p-4">
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
          purchaseDate: asset.purchaseDate ?? '',
          purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : 0,
          vendorId: asset.vendorId ?? '',
          warrantyExpiryDate: asset.warrantyExpiryDate ?? '',
          status: asset.status,
          condition: asset.condition,
          departmentId: asset.departmentId ? String(asset.departmentId) : '',
          notes: asset.notes ?? '',
        }}
      />
    </div>
  );
}
