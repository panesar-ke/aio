import { cache } from 'react';
import db from '@/drizzle/db';
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

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const forms = await fetchForms();
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

const fetchForms = cache(async () => {
  //TODO: Fetch forms based on user role
  const forms = await db.query.forms.findMany({
    columns: { id: true, formName: true, path: true, module: true },
    where: (forms, { eq }) => eq(forms.active, true),
    orderBy: (forms, { asc }) => [asc(forms.moduleId), asc(forms.menuOrder)],
  });
  console.log(forms.filter(f => f.module === 'procurement'));
  return forms;
});

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
