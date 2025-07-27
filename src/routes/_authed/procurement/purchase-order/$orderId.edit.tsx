import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authed/procurement/purchase-order/$orderId/edit',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/procurement/purchase-order/$orderId/edit"!</div>
}
