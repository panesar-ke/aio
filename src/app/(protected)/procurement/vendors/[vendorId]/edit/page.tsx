import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { ErrorBoundaryWithSuspense } from "@/components/custom/error-boundary-with-suspense";
import { FullPageWrapper } from "@/components/custom/full-page-wrapper";
import { FormLoader } from "@/components/custom/loaders";
import { VendorForm } from "@/features/procurement/components/vendors/vendor-form";
import { getVendor } from "@/features/procurement/services/vendors/data";

type Params = Promise<{ vendorId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const vendor = await getVendor((await params).vendorId);
  if (!vendor) {
    notFound();
  }
  return {
    title: `Edit Vendor - ${vendor.vendorName}`,
  };
}
export default async function NewVendorPage({ params }: { params: Params }) {
  return (
    <FullPageWrapper>
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the vendor"
        loader={<FormLoader />}
      >
        <EditVendorContent params={params} />
      </ErrorBoundaryWithSuspense>
    </FullPageWrapper>
  );
}

async function EditVendorContent({ params }: { params: Params }) {
  const vendor = await getVendor((await params).vendorId);
  if (!vendor) {
    notFound();
  }

  return <VendorForm vendor={vendor} />;
}
