import { createFileRoute, notFound } from '@tanstack/react-router'
import { materialRequisitionsQueryOptions } from '@/features/procurement/utils/query-options'
import FormHeader from '@/components/custom/form-header'
import { RequisitionForm } from '@/features/procurement/components/material-requisitions/requisition-form'
import { globalOptions } from '@/features/procurement/utils/query-options'

export const Route = createFileRoute(
  '/_authed/procurement/material-requisition/$requisitionId/edit',
)({
  loader: async ({ context, params: { requisitionId } }) => {
    const [projects, products, services, requisition] = await Promise.all([
      context.queryClient.ensureQueryData(globalOptions.selectableProjects()),
      context.queryClient.ensureQueryData(globalOptions.selectableProducts()),
      context.queryClient.ensureQueryData(globalOptions.selectableServices()),
      context.queryClient.ensureQueryData(
        materialRequisitionsQueryOptions.requisition(requisitionId),
      ),
    ])
    if (!requisition) {
      throw notFound()
    }

    if (requisition.linked) {
      throw new Error('You cannot edit a linked requisition')
    }

    return { requisition, projects, products, services }
  },
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Edit Requisition / PKL AIO' }] }),
})

function RouteComponent() {
  // const { requisitionId } = Route.useParams()
  const { requisition, projects, products, services } = Route.useLoaderData()
  return (
    <div className="space-y-6">
      <FormHeader title="Edit Requisition" />
      <RequisitionForm
        requisitionNo={requisition.id}
        key={requisition.reference}
        products={products}
        projects={projects}
        services={services}
        requisition={requisition}
      />
    </div>
  )
}
