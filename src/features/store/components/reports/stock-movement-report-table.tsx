'use client';

import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import type { Route } from 'next';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { StockMovementReportRow } from '@/features/store/utils/store.types';

import { DataTable } from '@/components/custom/datatable';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import Search from '@/components/custom/search';
import { numberFormat } from '@/lib/helpers/formatters';

type Props = {
  data: Array<StockMovementReportRow>;
  pageCount: number;
  page: number;
  pageSize: number;
  sortDir: 'asc' | 'desc';
};

const numericColumn = (
  key: keyof StockMovementReportRow,
  title: string,
): ColumnDef<StockMovementReportRow> => ({
  accessorKey: key,
  header: () => <div className="text-right">{title}</div>,
  enableSorting: false,
  cell: ({ row }) => (
    <div className="text-right">{numberFormat(row.original[key] as number)}</div>
  ),
});

export function StockMovementReportTable({
  data,
  pageCount,
  page,
  pageSize,
  sortDir,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`${pathname}?${params.toString()}` as Route);
  }

  function handleSearchChange(value: string) {
    navigate({ search: value, page: '1' });
  }

  function handlePaginationChange(
    updater: PaginationState | ((old: PaginationState) => PaginationState),
  ) {
    const current: PaginationState = { pageIndex: page - 1, pageSize };
    const next = typeof updater === 'function' ? updater(current) : updater;
    navigate({
      page: String(next.pageIndex + 1),
      pageSize: String(next.pageSize),
    });
  }

  function handleSortingChange(
    updater: SortingState | ((old: SortingState) => SortingState),
  ) {
    const current: SortingState = [
      { id: 'productName', desc: sortDir === 'desc' },
    ];
    const [next] = typeof updater === 'function' ? updater(current) : updater;
    navigate({
      sortDir: next?.desc ? 'desc' : 'asc',
      page: '1',
    });
  }

  const columns: Array<ColumnDef<StockMovementReportRow>> = [
    {
      accessorKey: 'productName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => row.original.productName?.toUpperCase(),
    },
    numericColumn('openingBalance', 'Opening Bal'),
    numericColumn('grn', 'GRNs'),
    numericColumn('issue', 'Issues'),
    numericColumn('transferOut', 'Transfers Out'),
    numericColumn('transferIn', 'Transfers In'),
    numericColumn('conversionOut', 'Conversion Out'),
    numericColumn('conversionIn', 'Conversion In'),
    numericColumn('closingBalance', 'Closing Bal'),
  ];

  return (
    <div className="space-y-4">
      <Search
        placeholder="Search by product name..."
        onHandleSearch={handleSearchChange}
        defaultValue={searchParams.get('search') ?? ''}
      />
      <DataTable
        columns={columns}
        data={data}
        manualPagination
        manualSorting
        pageCount={pageCount}
        pagination={{ pageIndex: page - 1, pageSize }}
        onPaginationChange={handlePaginationChange}
        sorting={[{ id: 'productName', desc: sortDir === 'desc' }]}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
}
