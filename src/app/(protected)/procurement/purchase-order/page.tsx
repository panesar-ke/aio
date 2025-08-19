import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ErrorBoundary } from 'react-error-boundary';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import { TableSkeleton } from '@/components/custom/table-skeleton';
import { getPurchaseOrders } from '@/features/procurement/services/purchase-orders/data';
import { OrdersTable } from '@/features/procurement/components/purchase-order/orders-table';

type SearchParams = Promise<{ search?: string }>;

export const metadata: Metadata = {
  title: 'Purchase Orders',
  description: 'Manage your purchase orders efficiently.',
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { search } = await searchParams;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Create and Manage your purchase orders."
        path="/procurement/purchase-order/new"
      />
      <Search placeholder="Search order..." />
      <ErrorBoundary
        fallback={<div className="text-red-500">Failed to load orders</div>}
      >
        <Suspense
          fallback={
            <TableSkeleton
              columnWidths={['w-24', 'w-24', 'w-56', 'w-1']}
              rowCount={10}
            />
          }
        >
          <SuspendedOrders q={search} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

async function SuspendedOrders({ q }: { q?: string }) {
  const orders = await getPurchaseOrders(q);
  return <OrdersTable orders={orders} />;
}
