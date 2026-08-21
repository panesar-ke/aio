import type { Metadata } from 'next';
import type { SearchParams } from 'nuqs/server';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { ClientSalesDashboardPage } from '@/features/sales/components/dashboard/sales-dashboard';
import { getSalesDashboard } from '@/features/sales/services/dashboard/data';
import { getSalesPersonWithSales } from '@/features/sales/services/orders/data';
import { saleUser } from '@/features/sales/utils/sale-helpers';
import { loadSalesDashboardSearchParams } from '@/features/sales/utils/search-params';
import { getFinancialYearOptions } from '@/lib/helpers/dates';

export const metadata: Metadata = {
  title: 'Sales Dashboard',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SalesDashboardPage({ searchParams }: PageProps) {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Sales Dashboard'
        description='Pipeline health and order performance across the sales module.'
      />
      <ErrorBoundaryWithSuspense loaderType='full'>
        <SuspendedSalesDashboard searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedSalesDashboard({ searchParams }: PageProps) {
  const { isSalesAdmin } = await saleUser();
  const filters = await loadSalesDashboardSearchParams(searchParams);
  const [dashboard, salesPersons] = await Promise.all([
    getSalesDashboard(filters),
    isSalesAdmin ? getSalesPersonWithSales() : Promise.resolve([]),
  ]);

  return (
    <ClientSalesDashboardPage
      dashboard={dashboard}
      financialYears={getFinancialYearOptions(4, 0)}
      salesPersons={salesPersons}
      isSalesAdmin={isSalesAdmin}
    />
  );
}
