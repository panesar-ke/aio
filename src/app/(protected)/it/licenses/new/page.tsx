import type { Metadata } from 'next';

import { LicenseForm } from '@/features/it/licenses/components/license-form';
import { getVendors } from '@/features/procurement/services/vendors/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Create New License',
};

export default async function NewLicensePage() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const vendors = await getVendors();
  return (
    <div className="max-w-2xl w-full mx-auto p-4 space-y-6">
      <LicenseForm
        vendors={vendors.map(vendor => ({
          value: vendor.id,
          label: vendor.vendorName,
        }))}
      />
    </div>
  );
}
