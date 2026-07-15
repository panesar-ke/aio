import type { Metadata } from "next";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorFallback } from "@/components/custom/error-components";
import PageHeader from "@/components/custom/page-header";
import { buttonVariants } from "@/components/ui/button";
import { BudgetTracker } from "@/features/it/components/dashboard/budget-tracker";
import { CategoryBreakdown } from "@/features/it/components/dashboard/category-breakdown";
import { DashboardSkeleton } from "@/features/it/components/dashboard/dashboard-skeleton";
import { KpiCards } from "@/features/it/components/dashboard/kpi-cards";
import { MonthlyOverviewChart } from "@/features/it/components/dashboard/monthly-overview-chart";
import { PeriodSelect } from "@/features/it/components/dashboard/period-select";
import { RecentExpenses } from "@/features/it/components/dashboard/recent-expenses";
import {
  buildDashboardKpis,
  getCategoryRollup,
  getMonthlyOverview,
  getRecentExpenses,
  getTotalSpent,
} from "@/features/it/services/dashboard/data";
import {
  DASHBOARD_PERIOD_LABELS,
  type DashboardPeriod,
  DEFAULT_DASHBOARD_PERIOD,
  getDashboardComparisonPeriodRange,
  getDashboardPeriodRange,
  isDashboardPeriod,
} from "@/lib/helpers/dates";
import { requireAnyPermission } from "@/lib/permissions/guards";
import { ErrorBoundaryWithSuspense } from "@/components/custom/error-boundary-with-suspense";

export const metadata: Metadata = {
  title: "IT Expenses & Budgeting",
};

type SearchParams = Promise<{ period?: string }>;

export default async function ITExpensesBudgetingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAnyPermission(["it:admin", "it:standard"], { mode: "page" });

  const { period: periodParam } = await searchParams;
  const period: DashboardPeriod =
    periodParam && isDashboardPeriod(periodParam)
      ? periodParam
      : DEFAULT_DASHBOARD_PERIOD;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={DASHBOARD_PERIOD_LABELS[period]}
        content={
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <PeriodSelect />
            <Link
              href="/it/expenses-budgeting/expenses/new"
              className={buttonVariants({ variant: "default" })}
            >
              <PlusIcon />
              Add Expense
            </Link>
          </div>
        }
      />
      <ErrorBoundaryWithSuspense loader={<DashboardSkeleton />}>
        <DashboardContent period={period} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function DashboardContent({ period }: { period: DashboardPeriod }) {
  const referenceDate = new Date();
  const range = getDashboardPeriodRange(period, referenceDate);
  const comparisonRange = getDashboardComparisonPeriodRange(
    period,
    referenceDate,
  );

  const [
    categoryRollup,
    comparisonTotalSpent,
    monthlyOverview,
    recentExpenses,
  ] = await Promise.all([
    getCategoryRollup(range),
    getTotalSpent(comparisonRange),
    getMonthlyOverview(range, period, referenceDate),
    getRecentExpenses(range),
  ]);

  const kpis = buildDashboardKpis(
    categoryRollup,
    range.monthsInPeriod,
    comparisonTotalSpent,
    comparisonRange.monthsInPeriod,
  );

  return (
    <div className="space-y-6">
      <KpiCards kpis={kpis} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <MonthlyOverviewChart data={monthlyOverview} />
        </div>
        <CategoryBreakdown
          categories={categoryRollup}
          periodLabel={DASHBOARD_PERIOD_LABELS[period]}
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentExpenses expenses={recentExpenses} />
        <BudgetTracker categories={categoryRollup} />
      </div>
    </div>
  );
}
