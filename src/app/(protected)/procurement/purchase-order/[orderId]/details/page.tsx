import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { ErrorBoundaryWithSuspense } from "@/components/custom/error-boundary-with-suspense";
import { LoadingSpinner } from "@/components/custom/loaders";
import PageHeader from "@/components/custom/page-header";
import { OrderView } from "@/features/procurement/components/purchase-order/order-view";
import { getPurchaseOrder } from "@/features/procurement/services/purchase-orders/data";

type Params = Promise<{ orderId: string }>;

export const metadata: Metadata = {
  title: "Purchase Order Details",
};
export default function OrderDetailsPage({ params }: { params: Params }) {
  return (
    <div className="space-y-6">
      <PageHeader title="View order details" />
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the purchase order"
        loader={<LoadingSpinner />}
      >
        <SuspendedComponent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedComponent({ params }: { params: Params }) {
  const { orderId } = await params;
  const order = await getPurchaseOrder(orderId);

  if (!order) notFound();
  return <OrderView order={order} />;
}
