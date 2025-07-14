import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ErrorNotification } from '@/components/custom/error-components'
import { globalOptions } from '@/features/procurement/utils/query-options'

export const Route = createFileRoute('/_authed/procurement')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(globalOptions.selectableProducts()),
      context.queryClient.prefetchQuery(globalOptions.selectableProjects()),
    ])
  },
  errorComponent: ({ error }) => <ErrorNotification message={error.message} />,
})

function RouteComponent() {
  return <Outlet />
}
