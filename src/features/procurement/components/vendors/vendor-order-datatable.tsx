'use client';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/custom/datatable';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { dateFormat, numberFormat } from '@/lib/helpers/formatters';
import type { VendorOrder } from '@/features/procurement/utils/procurement.types';

interface VendorOrderDatatableProps {
  orders: Array<VendorOrder>;
}

export function VendorOrderDatatable({ orders }: VendorOrderDatatableProps) {
  const columns: Array<ColumnDef<VendorOrder>> = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order #" />
      ),
    },
    {
      accessorKey: 'documentDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order Date" />
      ),
      cell: ({ row }) => dateFormat(row.original.documentDate, 'long'),
    },
    {
      accessorKey: 'invoiceDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice Date" />
      ),
      cell: ({
        row: {
          original: { invoiceDate },
        },
      }) => <div>{invoiceDate ? dateFormat(invoiceDate, 'long') : ''}</div>,
    },
    {
      accessorKey: 'discountedTotal',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Discounted Total"
          className="justify-end"
        />
      ),
      cell: ({
        row: {
          original: { discountedTotal },
        },
      }) => (
        <div className="text-right">
          {discountedTotal > 0 ? `Ksh ${numberFormat(discountedTotal)}` : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'orderValue',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Order Value"
          className="justify-end"
        />
      ),
      cell: ({
        row: {
          original: { orderValue },
        },
      }) => (
        <div className="text-right font-semibold">{`Ksh ${numberFormat(
          orderValue
        )}`}</div>
      ),
    },
  ];
  return <DataTable data={orders} columns={columns} />;
}
