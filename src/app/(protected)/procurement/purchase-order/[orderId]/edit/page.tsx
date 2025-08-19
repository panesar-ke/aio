import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { OrderForm } from '@/features/procurement/components/purchase-order/order-form';
import {
  getSelectableProducts,
  getSelectableProjects,
  getSelectableServices,
} from '@/features/procurement/services/material-requisitions/data';
import {
  getActiveVendors,
  getPendingRequests,
  getPurchaseOrder,
} from '@/features/procurement/services/purchase-orders/data';

export const metadata: Metadata = {
  title: 'Edit Purchase Order',
  description: 'Edit an existing purchase order',
};

type Params = Promise<{ orderId: string }>;

export default async function NewOrderPage({ params }: { params: Params }) {
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
  return (
    <div className="space-y-6">
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
    </div>
  );
}
