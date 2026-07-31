import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { PermissionProvider } from "@/components/auth/permission-provider";
import { AppSidebar, SidebarSkeleton } from "@/components/layout/app-sidebar";
import { AppNavbar } from "@/components/layout/navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUserPermissions } from "@/lib/permissions/service";
import { getCurrentUser } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ErrorBoundary
        fallback={
          <div role="alert">
            <p>Something went wrong:</p>
          </div>
        }
      >
        <Suspense fallback={<ProtectedLayoutFallback />}>
          <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
        </Suspense>
      </ErrorBoundary>
    </SidebarProvider>
  );
}

async function ProtectedLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  await getCurrentUser();
  const permissions = Array.from(await getCurrentUserPermissions());

  return (
    <PermissionProvider permissions={permissions}>
      <AppSidebar />
      <SidebarInset>
        <AppNavbar />
        <div className="flex min-h-0 flex-1 flex-col gap-4 bg-neutral">
          <div className="flex min-h-0 flex-1 flex-col gap-4 max-w-6xl mx-auto w-full py-4">
            {children}
          </div>
        </div>
      </SidebarInset>
    </PermissionProvider>
  );
}

function ProtectedLayoutFallback() {
  return (
    <>
      <SidebarSkeleton />
      <SidebarInset>
        <header className="flex h-16 bg-background sticky z-10 top-0 shrink-0 items-center gap-2 border-b p-4">
          <Skeleton className="h-10 w-56" />
          <div className="ml-auto flex items-center gap-2 px-4">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 bg-slate-50">
          <div className="flex min-h-0 flex-1 flex-col gap-4 max-w-6xl mx-auto w-full py-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
