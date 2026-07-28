import { type Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { AuthedPageLoader } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import { LicensePage } from '@/features/it/licenses/components/license-page';
import { getVendors } from '@/features/procurement/services/vendors/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Licenses',
};

export default function LicensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Software Licenses"
        description="Manage software licenses and subscriptions."
        path="/it/licenses/new"
      />
      <ErrorBoundaryWithSuspense loader={<AuthedPageLoader />}>
        <LicensesContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function LicensesContent() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const vendors = await getVendors();

  return (
    <LicensePage
      vendors={vendors.map(vendor => ({
        value: vendor.id,
        label: vendor.vendorName,
      }))}
    />
  );
}
