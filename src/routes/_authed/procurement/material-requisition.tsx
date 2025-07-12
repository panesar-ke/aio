import { createFileRoute } from '@tanstack/react-router'
import PageHeader from '@/components/custom/page-header'

export const Route = createFileRoute(
  '/_authed/procurement/material-requisition',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <PageHeader
        title="Material Requisition"
        path="/procurement/material-requisition"
        description="Create and manage material requisitions for procurement."
      />
    </div>
  )
}
