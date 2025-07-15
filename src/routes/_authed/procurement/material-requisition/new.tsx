import { createFileRoute } from '@tanstack/react-router'
import { LoadingSpinner } from '@/components/custom/loaders'
import { RequisitionForm } from '@/features/procurement/components/material-requisitions/requisition-form'
import FormHeader from '@/components/custom/form-header'
import { getRequisitionNo } from '@/features/procurement/services/server-fns'
import { globalOptions } from '@/features/procurement/utils/query-options'

export const Route = createFileRoute(
  '/_authed/procurement/material-requisition/new',
)({
  loader: async ({ context }) => {
    return await Promise.all([
      getRequisitionNo(),
      context.queryClient.ensureQueryData(globalOptions.selectableProjects()),
      context.queryClient.ensureQueryData(globalOptions.selectableProducts()),
      context.queryClient.ensureQueryData(globalOptions.selectableServices()),
    ])
  },
  component: RouteComponent,
  pendingComponent: () => <LoadingSpinner />,
  head: () => ({
    meta: [
      {
        title: 'Create Material Requisition / PKL AIO',
      },
    ],
  }),
})

function RouteComponent() {
  const [requisitionNo, projects, products, services] = Route.useLoaderData()
  return (
    <div className="space-y-6">
      <FormHeader
        title="Create Material Requisition"
        description="Create a new material requisition"
      />
      <RequisitionForm
        requisitionNo={requisitionNo}
        projects={projects}
        products={products}
        services={services}
      />
    </div>
  )
}
