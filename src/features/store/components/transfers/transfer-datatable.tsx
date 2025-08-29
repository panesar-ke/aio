'use client';

// import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import type { getTransfers } from '@/features/store/services/transfers/data';
import { DataTable } from '@/components/custom/datatable';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { dateFormat } from '@/lib/helpers/formatters';
// import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
// import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
// import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
// import { EditAction } from '@/components/custom/custom-button';

type TransferRow = Awaited<ReturnType<typeof getTransfers>>[number];

export function TransfersDatatable({ data }: { data: Array<TransferRow> }) {
  const columns: Array<ColumnDef<TransferRow>> = [
    {
      accessorKey: 'transferDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transfer Date" />
      ),
      cell: ({ row }) => (
        <span>{dateFormat(row.getValue('transferDate'), 'long')}</span>
      ),
    },
    {
      accessorKey: 'fromStore',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="From Store" />
      ),
    },
    {
      accessorKey: 'toStore',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="To Store" />
      ),
    },
    {
      id: 'actions',
      cell: () => null,
      //     (
      //     <DropdownMenu>
      //       <CustomDropdownTrigger />
      //       <CustomDropdownContent>
      //         <DropdownMenuItem asChild>
      //           <Link href={`/store/transfers/${id}/edit`}>
      //             <EditAction />
      //           </Link>
      //         </DropdownMenuItem>
      //       </CustomDropdownContent>
      //     </DropdownMenu>
      //   ),
    },
  ];
  return <DataTable data={data} columns={columns} />;
}
