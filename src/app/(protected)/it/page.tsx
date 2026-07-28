import { ErrorBoundaryWithSuspense } from "@/components/custom/error-boundary-with-suspense";
import PageHeader from "@/components/custom/page-header";
import { requireAnyPermission } from "@/lib/permissions/guards";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IT Dashboard",
};

export default function ITDashboardPage() {
  return (
    <div>
      <PageHeader title="IT Dashboard" />
      <ErrorBoundaryWithSuspense loader={<div className="h-0" />}>
        <ITDashboardAccess />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function ITDashboardAccess() {
  await requireAnyPermission(["it:admin", "it:standard"], { mode: "page" });
  return null;
}
