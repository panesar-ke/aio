import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { materialRequisitionsQueryOptions } from '@/features/procurement/utils/query-options'
import FormHeader from '@/components/custom/form-header'
import { Suspense } from 'react'
import {
  RequisitionSkeleton,
  RequisitionView,
} from '@/features/procurement/components/material-requisitions/requsition-view'
import { ErrorFallback } from '@/components/custom/error-components'

export const Route = createFileRoute(
  '/_authed/procurement/material-requisition/$requisitionId/details',
)({
  loader: async ({ context, params }) =>
    await context.queryClient.prefetchQuery(
      materialRequisitionsQueryOptions.requisition(params.requisitionId),
    ),
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Material Requisition Details / PKL AIO',
      },
    ],
  }),
})

function RouteComponent() {
  const { requisitionId } = Route.useParams()

  return (
    <div className="space-y-6">
      <FormHeader title={`Material Requisition Details`} />
      <ErrorBoundary fallbackRender={ErrorFallback}>
        <Suspense fallback={<RequisitionSkeleton />}>
          <RequisitionView requisitionId={requisitionId} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
