import { Suspense } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import PageHeader from '@/components/custom/page-header'
import { searchValidateSchema } from '@/lib/schema-rules'
import { purchaseOrdersQueryOptions } from '@/features/procurement/utils/query-options'
import { AuthedPageLoader } from '@/components/custom/loaders'
import { ErrorFallback } from '@/components/custom/error-components'
import { TableSkeleton } from '@/components/custom/table-skeleton'
import { OrdersTable } from '@/features/procurement/components/purchase-order/orders-table'
import Search from '@/components/custom/search'

export const Route = createFileRoute('/_authed/procurement/purchase-order/')({
  validateSearch: searchValidateSchema,
  loaderDeps: ({ search: { q } }) => ({ q }),
  loader: async ({ context, deps }) => {
    await context.queryClient.prefetchQuery(
      purchaseOrdersQueryOptions.all(deps.q),
    )
  },
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Purchase Orders / PKL AIO' }] }),
  pendingComponent: () => <AuthedPageLoader />,
})

function RouteComponent() {
  const { q } = Route.useSearch()
  const navigate = useNavigate({ from: '/procurement/purchase-order' })
  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Create and Manage your purchase orders."
        path="/procurement/purchase-order/new"
      />
      <Search
        placeholder="Search order..."
        defaultValue={q}
        onHandleSearch={(value) =>
          navigate({
            search: (prev) => ({
              ...prev,
              q: value.trim().length > 0 ? value : undefined,
            }),
          })
        }
      />
      <ErrorBoundary fallbackRender={ErrorFallback}>
        <Suspense
          fallback={
            <TableSkeleton
              columnWidths={['w-24', 'w-24', 'w-56', 'w-1']}
              rowCount={10}
            />
          }
        >
          <OrdersTable q={q} key={q} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
