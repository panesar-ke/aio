import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import { LicenseForm } from '@/features/it/licenses/components/license-form';
import { getVendors } from '@/features/procurement/services/vendors/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Create New License',
};

export default function NewLicensePage() {
  return (
    <div className="max-w-2xl w-full mx-auto p-4 space-y-6">
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while loading the license form"
        loader={<FormLoader />}
      >
        <NewLicenseContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function NewLicenseContent() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });
  const vendors = await getVendors();

  return (
    <LicenseForm
      vendors={vendors.map(vendor => ({
        value: vendor.id,
        label: vendor.vendorName,
      }))}
    />
  );
}
