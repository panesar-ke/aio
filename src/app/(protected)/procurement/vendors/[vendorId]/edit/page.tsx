import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import FormHeader from '@/components/custom/form-header';
import { FormLoader } from '@/components/custom/loaders';
import { VendorForm } from '@/features/procurement/components/vendors/vendor-form';
import { getVendor } from '@/features/procurement/services/vendors/data';

type Params = Promise<{ vendorId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const vendor = await getVendor((await params).vendorId);
  return {
    title: `Edit Vendor - ${vendor.vendorName}`,
  };
}
export default async function NewVendorPage({ params }: { params: Params }) {
  return (
    <div className="space-y-6">
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the vendor"
        loader={<FormLoader />}
      >
        <EditVendorContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function EditVendorContent({ params }: { params: Params }) {
  const vendor = await getVendor((await params).vendorId);

  return (
    <>
      <FormHeader
        title={`Edit Vendor - ${vendor.vendorName}`}
        description="Edit the details of this vendor."
      />
      <VendorForm vendor={vendor} />
    </>
  );
}
