'use client';
import type { ColumnDef } from '@tanstack/react-table';
import { ReportDataTable } from '@/components/custom/report-datatable';
import type { TopVendor } from '@/features/procurement/utils/procurement.types';
import { numberFormat } from '@/lib/helpers/formatters';

const columns: Array<ColumnDef<TopVendor>> = [
  {
    accessorKey: 'vendorName',
    header: 'Vendor Name',
  },
  {
    accessorKey: 'totalAmount',
    header: () => <div className="text-right">Total Amount</div>,
    cell: ({ row: { original } }) => (
      <div className="text-right font-medium">
        {numberFormat(original.totalAmount)}
      </div>
    ),
  },
  {
    accessorKey: 'discountedAmount',
    header: () => <div className="text-right">Discounted Amount</div>,
    cell: ({ row: { original } }) => (
      <div className="text-right font-medium">
        {original.discountedAmount > 0
          ? numberFormat(original.discountedAmount)
          : '-'}
      </div>
    ),
  },
];

export function TopVendorsTable({ data }: { data: Array<TopVendor> }) {
  return (
    <ReportDataTable
      excelData={data.map(item => ({
        'Vendor Name': item.vendorName,
        'Total Amount': numberFormat(item.totalAmount),
        'Discounted Amount': numberFormat(item.discountedAmount),
      }))}
      columns={columns}
      data={data}
      reportTitle="Top Vendors Report"
    />
  );
}
