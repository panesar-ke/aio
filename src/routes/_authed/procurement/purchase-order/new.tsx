import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { optionalStringSchemaEntry } from '@/lib/schema-rules'
import {
  globalOptions,
  materialRequisitionsQueryOptions,
  purchaseOrdersQueryOptions,
} from '@/features/procurement/utils/query-options'
import { getPurchaseOrderNo } from '@/features/procurement/services/orders/server-fns'
import FormHeader from '@/components/custom/form-header'
import { OrderForm } from '@/features/procurement/components/purchase-order/order-form'

const orderSearchSchema = z.object({
  requisitionId: optionalStringSchemaEntry().catch(''),
})

export const Route = createFileRoute('/_authed/procurement/purchase-order/new')(
  {
    validateSearch: orderSearchSchema,
    loaderDeps: ({ search: { requisitionId } }) => ({
      requisitionId,
    }),
    loader: async ({ context, deps: { requisitionId } }) => {
      const [
        purchaseOrderNo,
        selectableProjects,
        selectableProducts,
        selectableServices,
        pendingOrders,
        activeVendors,
        requisitionData,
      ] = await Promise.all([
        getPurchaseOrderNo(),
        context.queryClient.ensureQueryData(globalOptions.selectableProjects()),
        context.queryClient.ensureQueryData(globalOptions.selectableProducts()),
        context.queryClient.ensureQueryData(globalOptions.selectableServices()),
        context.queryClient.ensureQueryData(
          purchaseOrdersQueryOptions.pendingOrders(),
        ),
        context.queryClient.ensureQueryData(
          purchaseOrdersQueryOptions.activeVendors(),
        ),
        requisitionId
          ? context.queryClient.ensureQueryData(
              materialRequisitionsQueryOptions.requisition(requisitionId),
            )
          : Promise.resolve(null),
      ])
      return {
        purchaseOrderNo,
        selectableProjects,
        selectableProducts,
        selectableServices,
        pendingOrders,
        activeVendors,
        requisitionData: requisitionData
          ? {
              documentDate: new Date(requisitionData.documentDate),
              details: requisitionData.mrqDetails,
            }
          : null,
      }
    },
    component: RouteComponent,
    head: () => ({ meta: [{ title: 'New Purchase Order / PKL AIO' }] }),
  },
)

function RouteComponent() {
  const routerData = Route.useLoaderData()
  return (
    <div className="space-y-6">
      <FormHeader
        title="New Purchase Order"
        description="Create a new purchase order."
      />
      <OrderForm
        orderNo={routerData.purchaseOrderNo}
        pendingOrders={routerData.pendingOrders}
        vendors={routerData.activeVendors}
        requisitionData={routerData.requisitionData}
      />
    </div>
  )
}
