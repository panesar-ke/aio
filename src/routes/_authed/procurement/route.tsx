import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ErrorNotification } from '@/components/custom/error-components'

export const Route = createFileRoute('/_authed/procurement')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        context.trpc.procurement.selectableProducts.queryOptions(),
      ),
      context.queryClient.prefetchQuery(
        context.trpc.procurement.selectableProjects.queryOptions(),
      ),
    ])
  },
  errorComponent: ({ error }) => <ErrorNotification message={error.message} />,
})

function RouteComponent() {
  return <Outlet />
}
