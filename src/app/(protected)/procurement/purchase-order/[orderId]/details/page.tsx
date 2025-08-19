import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ErrorBoundary } from 'react-error-boundary';
import PageHeader from '@/components/custom/page-header';
import { OrderView } from '@/features/procurement/components/purchase-order/order-view';
import { getPurchaseOrder } from '@/features/procurement/services/purchase-orders/data';

import { LoadingSpinner } from '@/components/custom/loaders';

type Params = Promise<{ orderId: string }>;

export const metadata: Metadata = {
  title: 'Purchase Order Details',
};
export default async function OrderDetailsPage({ params }: { params: Params }) {
  const { orderId } = await params;
  return (
    <div className="space-y-6">
      <PageHeader title="View order details" />
      <ErrorBoundary
        fallback={
          <div className="text-center">Error loading order details</div>
        }
      >
        <Suspense fallback={<LoadingSpinner />}>
          <SuspendedComponent orderId={orderId} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

async function SuspendedComponent({ orderId }: { orderId: string }) {
  const order = await getPurchaseOrder(orderId);
  return <OrderView order={order} />;
}
