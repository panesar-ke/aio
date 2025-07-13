import { useSuspenseQuery } from '@tanstack/react-query'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

import { useTRPC } from '@/integrations/trpc/react'
import { Navigation } from '@/components/layout/nav-menu'
import { Skeleton } from '@/components/ui/skeleton'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.forms.queryOptions())
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <Navigation forms={data} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function Logo() {
  const { open } = useSidebar()

  if (!open) {
    return (
      <img
        src="/logos/favicon-black.svg"
        alt="Panesar Logo"
        className="size-6"
      />
    )
  }
  return (
    <img
      src="/logos/logo-light.svg"
      alt="Panesar Logo"
      className="w-1/3 h-auto py-4 mx-auto"
    />
  )
}

export function SidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton>
              <Skeleton className="size-4" />
              <Skeleton className="w-56 h-4" />
              <Skeleton className="size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
