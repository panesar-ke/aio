'use client';

import type { ColumnDef } from '@tanstack/react-table';

import type { getAccountDetails } from '@/features/sales/services/accounts/data';

import { DataTable } from '@/components/custom/datatable';
import { Badge } from '@/components/ui/badge';
import {
  buildSalesOrderLabel,
  formatTableDate,
} from '@/features/sales/utils/account-helpers';
import { formatSaleOrderAmount } from '@/features/sales/utils/sale-order-format';
import {
  saleOrderStatusLabel,
  saleOrderStatusVariant,
} from '@/features/sales/utils/sale-order-permissions';
import { numberFormat } from '@/lib/helpers/formatters';

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
        <div className='text-right font-medium tabular-nums'>
          {formatSaleOrderAmount(
            row.original.currency,
            row.original.amountInclusive,
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={saleOrderStatusVariant(row.original.status)}
          className='rounded-full px-2.5 py-1 text-[11px]'
        >
          {saleOrderStatusLabel(row.original.status)}
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
