import { type Metadata } from 'next';
import { type SearchParams } from 'nuqs';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { ClientAccountsPage } from '@/features/sales/components/accounts/accounts-page';
import { getAccounts } from '@/features/sales/services/accounts/data';
import { loadAccountSearchParams } from '@/features/sales/utils/search-params';

export const metadata: Metadata = {
  title: 'Accounts',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AccountsPage({ searchParams }: PageProps) {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Accounts'
        description='Customers created from converted leads.'
      />
      <ErrorBoundaryWithSuspense
        errorMessage='Error fetching data'
        loaderType='tableOnly'
      >
        <SuspendedAccounts searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedAccounts({ searchParams }: PageProps) {
  const params = await loadAccountSearchParams(searchParams);
  const accounts = await getAccounts(params);
  return <ClientAccountsPage accounts={accounts} />;
}
