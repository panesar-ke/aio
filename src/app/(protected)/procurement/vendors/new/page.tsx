import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { VendorForm } from '@/features/procurement/components/vendors/vendor-form';

export const metadata: Metadata = {
  title: 'New Vendor',
};
export default function NewVendorPage() {
  return (
    <div className="space-y-6">
      <FormHeader
        title="New Vendor"
        description="Add a new vendor to your procurement system."
      />
      <VendorForm />
    </div>
  );
}
