import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { OrderForm } from '@/features/procurement/components/purchase-order/order-form';
import {
  getRequisition,
  getSelectableProducts,
  getSelectableProjects,
  getSelectableServices,
} from '@/features/procurement/services/material-requisitions/data';
import {
  getActiveVendors,
  getPendingRequests,
  getPurchaseOrderNo,
} from '@/features/procurement/services/purchase-orders/data';

export const metadata: Metadata = {
  title: 'New Purchase Order',
  description: 'Create a new purchase order',
};

type SearchParams = Promise<{ requisition?: string }>;

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { requisition } = await searchParams;
  const [
    projects,
    products,
    services,
    vendors,
    orderNo,
    pendingOrders,
    requisitionData,
  ] = await Promise.all([
    getSelectableProjects(),
    getSelectableProducts(),
    getSelectableServices(),
    getActiveVendors(),
    getPurchaseOrderNo(),
    getPendingRequests(),
    requisition ? getRequisition(requisition) : Promise.resolve(null),
  ]);
  return (
    <div className="space-y-6">
      <FormHeader
        title="Create a New Purchase Order"
        description="Fill in the details below to create a new purchase order."
      />
      <OrderForm
        orderNo={orderNo}
        pendingOrders={pendingOrders}
        vendors={vendors}
        services={services}
        products={products}
        projects={projects}
        requisitionData={
          requisitionData
            ? {
                documentDate: new Date(requisitionData.documentDate),
                details: requisitionData.mrqDetails,
              }
            : null
        }
      />
    </div>
  );
}
