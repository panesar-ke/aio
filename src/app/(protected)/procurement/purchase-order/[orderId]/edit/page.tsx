import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import FormHeader from "@/components/custom/form-header";
import { LoadingSpinner } from "@/components/custom/loaders";
import { OrderForm } from "@/features/procurement/components/purchase-order/order-form";
import {
  getSelectableProducts,
  getSelectableProjects,
  getSelectableServices,
} from "@/features/procurement/services/material-requisitions/data";
import {
  getActiveVendors,
  getPendingRequests,
  getPurchaseOrder,
} from "@/features/procurement/services/purchase-orders/data";
import { rethrowIfNextNotFoundError } from "@/lib/next-http-errors";

export const metadata: Metadata = {
  title: "Edit Purchase Order",
  description: "Edit an existing purchase order",
};

type Params = Promise<{ orderId: string }>;

export default function NewOrderPage({ params }: { params: Params }) {
  return (
    <div className="space-y-6">
      <ErrorBoundary
        fallbackRender={({ error }) => {
          rethrowIfNextNotFoundError(error);

          return <div className="text-center">Error loading order details</div>;
        }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <EditPurchaseOrderContent params={params} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

async function EditPurchaseOrderContent({ params }: { params: Params }) {
  const { orderId } = await params;
  const [projects, products, services, vendors, pendingOrders, order] =
    await Promise.all([
      getSelectableProjects(),
      getSelectableProducts(),
      getSelectableServices(),
      getActiveVendors(),
      getPendingRequests(),
      getPurchaseOrder(orderId),
    ]);

  if (!order) notFound();

  return (
    <>
      <FormHeader
        title={`Edit Purchase Order ${order.id}`}
        description="Fill in the details below to create a new purchase order."
      />
      <OrderForm
        orderNo={order.id}
        pendingOrders={pendingOrders}
        vendors={vendors}
        services={services}
        products={products}
        projects={projects}
        order={order}
      />
    </>
  );
}
