import type { Metadata } from 'next';
import type { TopVendorFormValues } from '@/features/procurement/utils/procurement.types';
import { TopVendorForm } from '@/features/procurement/components/vendors/top-vendor-form';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { ErrorNotification } from '@/components/custom/error-components';
import { getTopVendors } from '@/features/procurement/services/reports/data';
import { isEmptyObject } from '@/lib/utils';
import { TopVendorsTable } from '@/features/procurement/components/vendors/top-vendors-table';

export const metadata: Metadata = {
  title: 'Top Vendors',
};

type SearchParams = Promise<{
  from: string;
  to: string;
  criteria: TopVendorFormValues['criteria'];
  top: string;
}>;

export default async function TopVendorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <TopVendorForm />
      {!isEmptyObject(params) && (
        <ErrorBoundaryWithSuspense
          errorMessage="Error loading top vendors"
          loaderType="tableOnly"
        >
          <SuspendedTopVendor searchParams={params} />
        </ErrorBoundaryWithSuspense>
      )}
    </div>
  );
}

async function SuspendedTopVendor({
  searchParams,
}: {
  searchParams: Partial<TopVendorFormValues>;
}) {
  const results = await getTopVendors(searchParams);

  if (results.error !== null) {
    return <ErrorNotification message={results.error} />;
  }

  return <TopVendorsTable data={results.data} />;
}
