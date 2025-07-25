import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { purchaseOrdersQueryOptions } from '@/features/procurement/utils/query-options'
import { ErrorFallback, NotFound } from '@/components/custom/error-components'
import PageHeader from '@/components/custom/page-header'
import { OrderView } from '@/features/procurement/components/purchase-order/order-view'
import { RequisitionSkeleton } from '@/features/procurement/components/material-requisitions/requsition-view'

export const Route = createFileRoute(
  '/_authed/procurement/purchase-order/$orderId/details',
)({
  loader: async ({ context, params: { orderId } }) => {
    await context.queryClient.prefetchQuery(
      purchaseOrdersQueryOptions.order(orderId),
    )
  },
  component: RouteComponent,
  notFoundComponent: () => <NotFound />,
  head: () => ({ meta: [{ title: 'Purchase Order Details / PKL AIO' }] }),
})

function RouteComponent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Order Details"
        description="View the details of this purchase order."
      />
      <ErrorBoundary fallbackRender={ErrorFallback}>
        <Suspense fallback={<RequisitionSkeleton />}>
          <OrderView />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
