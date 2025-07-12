import { Suspense } from 'react'
import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { BellDot, Lock, LogOutIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TRoutes } from '@/types/index.types'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar, SidebarSkeleton } from '@/components/layout/app-sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
          <div className="ml-auto flex items-center gap-2 px-4">
            <HeaderNavItem
              toolTipContent="Change Password"
              linkPath="/"
              Icon={Lock}
            />
            <HeaderNavItem
              toolTipContent="Notifications"
              linkPath="/"
              Icon={BellDot}
            />
            <HeaderNavItem
              toolTipContent="Logout"
              linkPath="/logout"
              Icon={LogOutIcon}
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

interface HeaderNavItemProps {
  linkPath: TRoutes
  toolTipContent?: string
  Icon: LucideIcon
}

function HeaderNavItem({ linkPath, toolTipContent, Icon }: HeaderNavItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Link
          to={linkPath}
          className="size-8 rounded-full border grid place-content-center"
        >
          <Icon className="size-4 text-muted-foreground" />
        </Link>
      </TooltipTrigger>
      <TooltipContent className="rounded-full">
        <p>{toolTipContent}</p>
      </TooltipContent>
    </Tooltip>
  )
}
