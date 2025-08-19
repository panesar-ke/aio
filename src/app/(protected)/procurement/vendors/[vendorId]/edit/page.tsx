import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
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
  const vendor = await getVendor((await params).vendorId);
  return (
    <div className="space-y-6">
      <FormHeader
        title={`Edit Vendor - ${vendor.vendorName}`}
        description="Edit the details of this vendor."
      />
      <VendorForm vendor={vendor} />
    </div>
  );
}
