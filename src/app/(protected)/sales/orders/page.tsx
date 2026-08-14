import type { Metadata } from 'next';
import type { SearchParams } from 'nuqs/server';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { ClientSalesOrderPage } from '@/features/sales/components/orders/sales-order-page';
import { getAccounts } from '@/features/sales/services/accounts/data';
import {
  getSalesOrders,
  getSalesPersonWithSales,
} from '@/features/sales/services/orders/data';
import { saleUser } from '@/features/sales/utils/sale-helpers';
import {
  AccountTier,
  loadSalesOrderSearchParams,
} from '@/features/sales/utils/search-params';
import { titleCase } from '@/lib/helpers/formatters';

export const metadata: Metadata = {
  title: 'Sales Orders',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SalesOrdersPage({ searchParams }: PageProps) {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Sales Orders'
        description='Create and manage customer sales orders.'
        path='/sales/orders/new'
        buttonText='New Sales Order'
      />
      <ErrorBoundaryWithSuspense loaderType='full'>
        <SuspendedSalesOrders searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedSalesOrders({ searchParams }: PageProps) {
  const { isSalesAdmin } = await saleUser();
  const { to, account, from, salesPerson, search } =
    await loadSalesOrderSearchParams(searchParams);
  const [salesPersons, accounts, salesOrders] = await Promise.all([
    getSalesPersonWithSales(),
    getAccounts({ search: '', tier: AccountTier.all, lastPurchase: null }),
    getSalesOrders({
      account,
      from,
      to,
      search,
      salesPerson,
    }),
  ]);
  return (
    <ClientSalesOrderPage
      salesPersons={salesPersons}
      isSalesAdmin={isSalesAdmin}
      accounts={accounts.map((a) => ({
        value: a.id,
        label: titleCase(a.company.toLowerCase()),
      }))}
      orders={salesOrders}
    />
  );
}
