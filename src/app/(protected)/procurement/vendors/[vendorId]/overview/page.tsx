import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ErrorBoundary } from 'react-error-boundary';
import type { VendorOrder } from '@/features/procurement/utils/procurement.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorNotification } from '@/components/custom/error-components';
import {
  getVendor,
  getVendorOrders,
} from '@/features/procurement/services/vendors/data';
import { compactNumberFormatter } from '@/lib/helpers/formatters';
import { VendorOrderDatatable } from '@/features/procurement/components/vendors/vendor-order-datatable';

type Params = Promise<{ vendorId: string }>;

export const metadata: Metadata = {
  title: 'Vendor Overview',
};

function OverviewHeaderLoading() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-4 w-80" />
        </div>

        <div className="flex gap-x-6">
          <div className="flex flex-col items-end space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>

          <div className="flex flex-col items-end border-l border-gray-200 pl-4 space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </header>
    </div>
  );
}

export default async function VendorOverviewPage({
  params,
}: {
  params: Params;
}) {
  const { vendorId } = await params;
  return (
    <div className="space-y-6">
      <ErrorBoundary
        fallback={<ErrorNotification message="Error fetching vendor details" />}
      >
        <Suspense fallback={<OverviewHeaderLoading />}>
          <OverviewHeader vendorId={vendorId} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

async function OverviewHeader({ vendorId }: { vendorId: string }) {
  const [vendor, orders] = await Promise.all([
    getVendor(vendorId),
    getVendorOrders(vendorId),
  ]);
  const { orderTotal, discounted } = orders.reduce(
    (acc, detail) => ({
      orderTotal: acc.orderTotal + parseFloat(detail.orderValue.toString()),
      discounted:
        acc.discounted + (parseFloat(detail?.discountedTotal.toString()) ?? 0),
    }),
    { orderTotal: 0, discounted: 0 }
  );
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-display text-primary uppercase">
            {vendor.vendorName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Contact: {vendor.contact} | Email: {vendor.email ?? 'N/A'} | Contact
            Person: {vendor.contactPerson?.toUpperCase()}
          </p>
          <p className="text-sm text-muted-foreground">
            Address: {vendor.address?.toUpperCase() ?? 'N/A'} | Tax PIN:{' '}
            {vendor.kraPin?.toUpperCase() ?? 'N/A'}
          </p>
        </div>
        <div className="flex gap-x-6">
          <div className="flex flex-col items-end">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-semibold text-primary">{`Ksh ${compactNumberFormatter(
              orderTotal
            )}`}</p>
          </div>
          <div className="flex flex-col items-end border-l border-gray-200 pl-4">
            <p className="text-sm text-muted-foreground">Discounted</p>
            <p className="text-2xl font-semibold text-primary">
              {discounted > 0
                ? `Ksh ${compactNumberFormatter(discounted)}`
                : '-'}
            </p>
          </div>
        </div>
      </header>
      <TransactionHistory orders={orders} />
    </div>
  );
}

function TransactionHistory({ orders }: { orders: Array<VendorOrder> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-foreground">
        {/* <Search placeholder="Search transactions..." /> */}
        <VendorOrderDatatable orders={orders} />
      </CardContent>
    </Card>
  );
}
