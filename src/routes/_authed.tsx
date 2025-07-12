import { Suspense } from 'react'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar, SidebarSkeleton } from '@/components/layout/app-sidebar'

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context, location }) => {
    if (!context.user?.id) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(context.trpc.forms.queryOptions())
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <ErrorBoundary
        fallback={
          <div role="alert">
            <p>Something went wrong:</p>
          </div>
        }
      >
        <Suspense fallback={<SidebarSkeleton />}>
          <AppSidebar />
        </Suspense>
      </ErrorBoundary>
      <SidebarInset>
        <header className="flex h-16 bg-background sticky top-0 shrink-0 items-center gap-2 border-b p-4">
          <div className="ml-auto flex items-center gap-2 px-4"></div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
