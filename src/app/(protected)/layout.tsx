import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppSidebar, SidebarSkeleton } from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppNavbar } from '@/components/layout/navbar';
import { PermissionProvider } from '@/components/auth/permission-provider';
import { getCurrentUserPermissions } from '@/lib/permissions/service';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const permissions = Array.from(await getCurrentUserPermissions());

  return (
    <PermissionProvider permissions={permissions}>
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
          <AppNavbar />
          <div className="flex flex-1 flex-col gap-4 bg-slate-50">
            <div className="flex flex-1 flex-col gap-4 max-w-6xl mx-auto w-full py-4">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </PermissionProvider>
  );
}
