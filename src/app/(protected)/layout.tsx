import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { PasswordPolicyBanner } from "@/components/auth/password-policy-banner";
import { PermissionProvider } from "@/components/auth/permission-provider";
import { AppSidebar, SidebarSkeleton } from "@/components/layout/app-sidebar";
import { AppNavbar } from "@/components/layout/navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isPolicyCompliant,
  parsePolicyDeadline,
  policyDeadlineDays,
  shouldWarnAboutPolicy,
} from "@/features/auth/utils/password-policy";
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
  const user = await getCurrentUser();
  const permissions = Array.from(await getCurrentUserPermissions());

  const now = new Date();
  const deadline = parsePolicyDeadline(process.env.PASSWORD_POLICY_DEADLINE);

  const daysToDeadline = policyDeadlineDays(deadline, now);

  // Quiet until the final week — the notifications carry the long tail.
  const warnAboutPolicy = shouldWarnAboutPolicy({
    compliant: isPolicyCompliant(user.passwordPolicyVersion),
    deadline,
    exemptUntil: user.passwordPolicyExemptUntil,
    now,
  });

  return (
    <PermissionProvider permissions={permissions}>
      <AppSidebar />
      <SidebarInset>
        <AppNavbar />
        <div className="flex min-h-0 flex-1 flex-col gap-4 bg-neutral">
          <div className="flex min-h-0 flex-1 flex-col gap-4 max-w-6xl mx-auto w-full py-4">
            {warnAboutPolicy && daysToDeadline !== null && (
              <PasswordPolicyBanner days={daysToDeadline} />
            )}
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
