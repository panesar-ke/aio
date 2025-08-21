import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import Logo from '@/components/layout/logo';
import { generateRandomString } from '@/lib/utils';
import { Navigation } from '@/components/layout/navigation';
import { getUserForms } from '@/features/admin/services/data';

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const forms = await getUserForms();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <Navigation forms={forms} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export function SidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {Array.from({ length: 5 }).map(() => (
            <SidebarMenuItem key={generateRandomString(5)}>
              <SidebarMenuButton>
                <Skeleton className="size-4" />
                <Skeleton className="w-56 h-4" />
                <Skeleton className="size-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

//logout action
// async function handleLogout() {
//   await logoutAction();
// }
