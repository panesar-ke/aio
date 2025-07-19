import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { AuthedPageLoader } from '@/components/custom/loaders'
import { RequisitionsDataTable } from '@/features/procurement/components/material-requisitions/requisitions-datatable'
import PageHeader from '@/components/custom/page-header'
import { TableSkeleton } from '@/components/custom/table-skeleton'
import { ErrorFallback } from '@/components/custom/error-components'
import { materialRequisitionsQueryOptions } from '@/features/procurement/utils/query-options'
import Search from '@/components/custom/search'
import { searchValidateSchema } from '@/lib/schema-rules'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authed/procurement/material-requisition/',
)({
  validateSearch: searchValidateSchema,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      materialRequisitionsQueryOptions.all(),
    )
  },
  component: RouteComponent,
  pendingComponent: () => <AuthedPageLoader />,
  head: () => ({
    meta: [
      {
        title: 'Material Requisition / PKL AIO',
        description: 'Create and manage material requisitions for procurement.',
      },
    ],
  }),
})

function RouteComponent() {
  const navigate = useNavigate({ from: '/procurement/material-requisition' })
  const { q } = Route.useSearch()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Requisition"
        path="/procurement/material-requisition/new"
        description="Create and manage material requisitions for procurement."
      />
      <Search
        defaultValue={q}
        onHandleSearch={(value) =>
          navigate({
            search: (prev) => ({
              ...prev,
              q: value.trim().length > 0 ? value : undefined,
            }),
          })
        }
        placeholder="Search requisitions..."
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
          <RequisitionsDataTable />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
