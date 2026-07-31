import { connection } from 'next/server';

import { DashboardStatsGrid } from '@/components/custom/dashboard-stats-card';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import {
  OrderAreaChart,
  OrderAreaChartLoading,
} from '@/features/procurement/components/dashboard/order-area-chart';
import { PurchaseByCategory } from '@/features/procurement/components/dashboard/purchase-by-category';
import {
  TopVendorsChart,
  TopVendorsChartLoading,
} from '@/features/procurement/components/dashboard/top-vendors-chart';
import {

  getDashboardStats,
  getPurchasesByDate,
  getRevenueStats,
  getSpendingByProductCategory,
  getTopVendorsDetails,
} from '@/features/procurement/services/dashboard/data';

import { VendorStatsLoading } from './vendors/page';

export const metadata = {
  title: 'Procurement Dashboard',
};

export default async function ProcurementDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement Dashboard Insights"
        description="Comprehensive view of procurement activities and performance for the last 30 days."
      />
      <ErrorBoundaryWithSuspense
        loader={<VendorStatsLoading />}
        errorMessage="Error loading dashboard stats"
      >
        <DashboardStats />
      </ErrorBoundaryWithSuspense>
      <ErrorBoundaryWithSuspense
        loader={<OrderAreaChartLoading />}
        errorMessage="Error loading purchases by date"
      >
        <PurchasesByServiceItemByDate />
      </ErrorBoundaryWithSuspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ErrorBoundaryWithSuspense
          loader={<TopVendorsChartLoading />}
          errorMessage="Error fetching top vendors"
        >
          <TopVendors />
        </ErrorBoundaryWithSuspense>
        <ErrorBoundaryWithSuspense
          loader={<TopVendorsChartLoading />}
          errorMessage="Error fetching spending by product category"
        >
          <SpendingByProductCategory />
        </ErrorBoundaryWithSuspense>
      </div>
    </div>
  );
}

async function DashboardStats() {
  await connection();
  const referenceDate = new Date();
  const { revenue, orders, discountedAmount, averageOrder, lastUpdated } =
    await getDashboardStats(referenceDate);
  return (
    <DashboardStatsGrid
      dashboardStats={{
        revenue,
        orders,
        discountedAmount,
        averageOrder,
        lastUpdated,
      }}
    />
  );
}

async function PurchasesByServiceItemByDate() {
  await connection();
  const data = await getPurchasesByDate(new Date());
  return <OrderAreaChart data={data} />;
}

async function TopVendors() {
  await connection();
  const referenceDate = new Date();
  const [topVendors, { last30Days }] = await Promise.all([
    getTopVendorsDetails(referenceDate),
    getRevenueStats(referenceDate),
  ]);
  return <TopVendorsChart totalOrders={last30Days} topVendors={topVendors} />;
}

async function SpendingByProductCategory() {
  await connection();
  const spendingByProductCategory = await getSpendingByProductCategory(
    new Date(),
  );
  return (
    <PurchaseByCategory spendingByProductCategory={spendingByProductCategory} />
  );
}
