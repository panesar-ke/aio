import type { Metadata } from 'next';
import type { SearchParams } from 'nuqs/server';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { LeadsClientPage } from '@/features/sales/components/leads/leads-page';
import { getLeads } from '@/features/sales/services/leads/data';
import { loadLeadSearchParams } from '@/features/sales/utils/search-params';

export const metadata: Metadata = {
  title: 'Leads',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function LeadsPage({ searchParams }: PageProps) {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Leads'
        description='Track and qualify prospects before converting them to customers.'
        path='/sales/leads/new'
        buttonText='New Lead'
      />
      <ErrorBoundaryWithSuspense
        loaderType='tableOnly'
        errorMessage='Failed to load leads'
      >
        <SuspendedLeads searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedLeads({ searchParams }: PageProps) {
  const { search, status } = await loadLeadSearchParams(searchParams);
  const leads = await getLeads({ search, status });
  return <LeadsClientPage leads={leads} />;
}
