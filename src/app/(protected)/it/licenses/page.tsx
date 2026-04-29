import { type Metadata } from 'next';

import PageHeader from '@/components/custom/page-header';
import { LicensePage } from '@/features/it/licenses/components/license-page';
import { getVendors } from '@/features/procurement/services/vendors/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Licenses',
};

export default async function LicensesPage() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const vendors = await getVendors();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Software Licenses"
        description="Manage software licenses and subscriptions."
        path="/it/licenses/new"
      />
      <LicensePage
        vendors={vendors.map(vendor => ({
          value: vendor.id,
          label: vendor.vendorName,
        }))}
      />
    </div>
  );
}
