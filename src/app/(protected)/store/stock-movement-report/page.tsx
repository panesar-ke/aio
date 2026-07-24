import type { Metadata } from 'next';

import { endOfMonth, startOfMonth } from 'date-fns';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { ErrorNotification } from '@/components/custom/error-components';
import PageHeader from '@/components/custom/page-header';
import { StockMovementReportForm } from '@/features/store/components/reports/stock-movement-report-form';
import { StockMovementReportTable } from '@/features/store/components/reports/stock-movement-report-table';
import { getStockMovementReport } from '@/features/store/services/reports/data';
import { getMainStore, getStores } from '@/features/store/services/stores/data';
import { dateFormat, transformOptions } from '@/lib/helpers/formatters';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Stock Movement Report',
};

type SearchParams = Promise<{
  storeId?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
}>;

export default async function StockMovementReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAnyPermission(['store:admin', 'store:standard'], {
    mode: 'page',
  });

  const params = await searchParams;
  const [stores, mainStore] = await Promise.all([
    getStores(),
    getMainStore(),
  ]);

  const storeId = params.storeId || mainStore.value;
  const from = params.from || dateFormat(startOfMonth(new Date()));
  const to = params.to || dateFormat(endOfMonth(new Date()));
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 10;
  const sortDir = params.sortDir === 'desc' ? 'desc' : 'asc';
  const search = params.search;

  const storeOptions = transformOptions(
    stores.map(store => ({ id: store.id, name: store.storeName })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movement Report"
        description="View opening balance, period movements and closing balance by product and store."
      />
      <StockMovementReportForm
        stores={storeOptions}
        defaultValues={{ storeId, from, to }}
      />
      <ErrorBoundaryWithSuspense
        errorMessage="There was a problem generating the stock movement report"
        loaderType="tableOnly"
      >
        <SuspendedStockMovementReport
          storeId={storeId}
          from={from}
          to={to}
          page={page}
          pageSize={pageSize}
          sortDir={sortDir}
          search={search}
        />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedStockMovementReport({
  storeId,
  from,
  to,
  page,
  pageSize,
  sortDir,
  search,
}: {
  storeId: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
  sortDir: 'asc' | 'desc';
  search?: string;
}) {
  const result = await getStockMovementReport({
    storeId,
    from,
    to,
    page,
    pageSize,
    sortDir,
    search,
  });

  if (result.error !== null) {
    return <ErrorNotification message={result.error} />;
  }

  return (
    <StockMovementReportTable
      data={result.data}
      pageCount={result.pageCount}
      page={page}
      pageSize={pageSize}
      sortDir={sortDir}
    />
  );
}
