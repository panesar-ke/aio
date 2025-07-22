import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { optionalStringSchemaEntry } from '@/lib/schema-rules'
import {
  globalOptions,
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
    loader: async ({ context }) => {
      const [
        purchaseOrderNo,
        selectableProjects,
        selectableProducts,
        selectableServices,
        pendingOrders,
        activeVendors,
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
      ])
      return {
        purchaseOrderNo,
        selectableProjects,
        selectableProducts,
        selectableServices,
        pendingOrders,
        activeVendors,
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
      />
    </div>
  )
}
