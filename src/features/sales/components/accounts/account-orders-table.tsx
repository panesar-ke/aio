'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/custom/datatable';
import { Badge } from '@/components/ui/badge';
import { type getAccountDetails } from '@/features/sales/services/accounts/data';
import { numberFormat } from '@/lib/helpers/formatters';

import {
  buildSalesOrderLabel,
  formatCurrency,
  formatTableDate,
} from './account-details-page';

type AccountOrder = NonNullable<
  Awaited<ReturnType<typeof getAccountDetails>>
>['orders'][number];

export function createAccountOrderColumns(): Array<ColumnDef<AccountOrder>> {
  return [
    {
      accessorKey: 'saleOrderNo',
      header: 'Order No.',
      cell: ({ row }) => (
        <span className='font-medium text-primary'>
          {buildSalesOrderLabel(
            row.original.saleOrderNo,
            row.original.dateRaised,
          )}
        </span>
      ),
    },
    {
      accessorKey: 'dateRaised',
      header: 'Date',
      cell: ({ row }) => formatTableDate(row.original.dateRaised),
    },
    {
      accessorKey: 'itemCount',
      header: 'Items',
      cell: ({ row }) => (
        <span className='text-muted-foreground'>
          {numberFormat(row.original.itemCount, 0)}
        </span>
      ),
    },
    {
      accessorKey: 'amountInclusive',
      header: () => <div className='text-right'>Amount</div>,
      cell: ({ row }) => (
        <div className='text-right font-medium'>
          {formatCurrency(row.original.amountInclusive)}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => (
        <Badge
          variant='success'
          className='rounded-full px-2.5 py-1 text-[11px]'
        >
          Fulfilled
        </Badge>
      ),
    },
  ];
}

export function AccountOrdersTable({
  orders,
}: {
  orders: Array<AccountOrder>;
}) {
  return (
    <DataTable
      columns={createAccountOrderColumns()}
      data={orders}
      className='border-x-0 rounded-none'
    />
  );
}
