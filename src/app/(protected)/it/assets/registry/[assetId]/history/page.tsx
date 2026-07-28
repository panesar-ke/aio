import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { AuthedPageLoader } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import { BackButton } from '@/components/ui/back-button';
import { AssetHistoryPage } from '@/features/it/assets/components/asset-history-page';
import {

  getAssetAssignmentHistoryByAssetId,
  getAssetById,
} from '@/features/it/assets/services/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Asset Assignment History',
};

type Params = Promise<{ assetId: string }>;

export default function AssetHistoryRoute({
  params,
}: {
  params: Params;
}) {
  return (
    <div className="space-y-6">
      <BackButton variant="link">Go Back</BackButton>
      <PageHeader
        title="Asset Assignment History"
        description="Review all assignment and return events for this asset"
      />
      <ErrorBoundaryWithSuspense loader={<AuthedPageLoader />}>
        <AssetHistoryContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function AssetHistoryContent({ params }: { params: Params }) {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const { assetId } = await params;

  const [asset, rows] = await Promise.all([
    getAssetById(assetId),
    getAssetAssignmentHistoryByAssetId(assetId),
  ]);

  return <AssetHistoryPage assetName={asset.name} rows={rows} />;
}
