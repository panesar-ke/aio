import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import {
  getDashboardStats,
  getPurchasesByDate,
  getRevenueStats,
  getSpendingByProductCategory,
  getTopVendorsDetails,
} from '@/features/procurement/services/dashboard/data';
import { VendorStatsLoading } from './vendors/page';
import { DashboardStatsGrid } from '@/components/custom/dashboard-stats-card';
import {
  OrderAreaChart,
  OrderAreaChartLoading,
} from '@/features/procurement/components/dashboard/order-area-chart';
import {
  TopVendorsChart,
  TopVendorsChartLoading,
} from '@/features/procurement/components/dashboard/top-vendors-chart';
import { PurchaseByCategory } from '@/features/procurement/components/dashboard/purchase-by-category';

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
  const { revenue, orders, discountedAmount, averageOrder, lastUpdated } =
    await getDashboardStats();
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
  const data = await getPurchasesByDate();
  return <OrderAreaChart data={data} />;
}

async function TopVendors() {
  const [topVendors, { last30Days }] = await Promise.all([
    getTopVendorsDetails(),
    getRevenueStats(),
  ]);
  return <TopVendorsChart totalOrders={last30Days} topVendors={topVendors} />;
}

async function SpendingByProductCategory() {
  const spendingByProductCategory = await getSpendingByProductCategory();
  return (
    <PurchaseByCategory spendingByProductCategory={spendingByProductCategory} />
  );
}
