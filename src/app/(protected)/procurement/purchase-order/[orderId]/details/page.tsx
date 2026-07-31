import type { Metadata } from 'next';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { LoadingSpinner } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import { OrderView } from '@/features/procurement/components/purchase-order/order-view';
import { getPurchaseOrder } from '@/features/procurement/services/purchase-orders/data';

type Params = Promise<{ orderId: string }>;

export const metadata: Metadata = {
  title: 'Purchase Order Details',
};
export default function OrderDetailsPage({ params }: { params: Params }) {
  return (
    <div className="space-y-6">
      <PageHeader title="View order details" />
      <ErrorBoundary
        fallback={
          <div className="text-center">Error loading order details</div>
        }
      >
        <Suspense fallback={<LoadingSpinner />}>
          <SuspendedComponent params={params} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

async function SuspendedComponent({ params }: { params: Params }) {
  const { orderId } = await params;
  const order = await getPurchaseOrder(orderId);
  return <OrderView order={order} />;
}
