import type { Metadata } from "next";

import { FullPageWrapper } from "@/components/custom/full-page-wrapper";
import { VendorForm } from "@/features/procurement/components/vendors/vendor-form";

export const metadata: Metadata = {
  title: "New Vendor",
};
export default function NewVendorPage() {
  return (
    <FullPageWrapper>
      <VendorForm />
    </FullPageWrapper>
  );
}
