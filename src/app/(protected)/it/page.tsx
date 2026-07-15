import PageHeader from "@/components/custom/page-header";
import { requireAnyPermission } from "@/lib/permissions/guards";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IT Dashboard",
};

export default async function ITDashboardPage() {
  await requireAnyPermission(["it:admin", "it:standard"], { mode: "page" });
  return (
    <div>
      <PageHeader title="IT Dashboard" />
    </div>
  );
}
