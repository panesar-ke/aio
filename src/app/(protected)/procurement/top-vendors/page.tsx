import type { Metadata } from 'next';

import type { TopVendorFormValues } from '@/features/procurement/utils/procurement.types';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { ErrorNotification } from '@/components/custom/error-components';
import { TopVendorForm } from '@/features/procurement/components/vendors/top-vendor-form';
import { TopVendorsTable } from '@/features/procurement/components/vendors/top-vendors-table';
import { getTopVendors } from '@/features/procurement/services/reports/data';
import { isEmptyObject } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Top Vendors',
};

type SearchParams = Promise<{
  from: string;
  to: string;
  criteria: TopVendorFormValues['criteria'];
  top: string;
}>;

export default function TopVendorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <TopVendorForm />
      <ErrorBoundaryWithSuspense
        errorMessage="Error loading top vendors"
        loaderType="tableOnly"
      >
        <SuspendedTopVendor searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedTopVendor({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  if (isEmptyObject(params)) {
    return null;
  }

  const results = await getTopVendors(params);

  if (results.error !== null) {
    return <ErrorNotification message={results.error} />;
  }

  return <TopVendorsTable data={results.data} />;
}
