import { useSuspenseQuery } from '@tanstack/react-query'
import { initials } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'

import type { User } from '@/types/index.types'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/integrations/trpc/react'
import { Navigation } from '@/components/layout/nav-menu'
import { Skeleton } from '@/components/ui/skeleton'

function getInitials(name: string) {
  const parts = name.split(' ')
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase()
}

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

interface UserAvatarProps {
  user: User
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const avatar = createAvatar(initials, {
    seed: user.name,
    fontFamily: ['Open Sans'],
    fontWeight: 500,
    fontSize: 32,
  })

  const dataUri = avatar.toDataUri()

  return (
    <Avatar className={cn('size-10 shrink-0', className)}>
      <AvatarImage src={user.image ?? dataUri} alt={user.name} />
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
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
