import type { Metadata } from 'next';

import { ClipboardListIcon, ComputerIcon } from 'lucide-react';
import Link from 'next/link';

import PageHeader from '@/components/custom/page-header';
import { buttonVariants } from '@/components/ui/button';
import { ITAssetsDashboard } from '@/features/it/assets/components/dashboard/assets-dashboard';
import { getITAssetsDashboardStats } from '@/features/it/assets/services/dashboard';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'IT Assets',
};

export default async function ITAssetsPage() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const stats = await getITAssetsDashboardStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="IT Assets"
        description="Operational and cost analytics for IT assets and assignments"
        content={
          <div className="flex gap-4 items-center">
            <Link href="/it/assets/registry" className={buttonVariants()}>
              <ComputerIcon />
              Registry
            </Link>
            <Link
              href="/it/assets/assignments"
              className={buttonVariants({ variant: 'pdfExport' })}
            >
              <ClipboardListIcon />
              Assignment Log
            </Link>
          </div>
        }
      />
      <ITAssetsDashboard data={stats} />
    </div>
  );
}
