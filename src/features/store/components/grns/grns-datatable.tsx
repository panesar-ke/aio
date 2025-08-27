'use client';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import type { getGrns } from '@/features/store/services/grns/data';
import { DataTable } from '@/components/custom/datatable';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { dateFormat } from '@/lib/helpers/formatters';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import {
  DeleteAction,
  ViewDetailsAction,
} from '@/components/custom/custom-button';
import { ActionButton } from '@/components/ui/action-button';
import { deleteGrn } from '@/features/store/services/grns/actions';

type GrnTableRow = Awaited<ReturnType<typeof getGrns>>[number];

export function GrnsDatatable({ grns }: { grns: Array<GrnTableRow> }) {
  async function handleDelete(grnId: string) {
    const response = await deleteGrn(grnId);
    return { error: response.error, message: response.message };
  }
  const columns: Array<ColumnDef<GrnTableRow>> = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Grn #" />
      ),
    },
    {
      accessorKey: 'grnDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="GRN Date" />
      ),
      cell: ({
        row: {
          original: { grnDate },
        },
      }) => dateFormat(grnDate, 'long'),
    },
    {
      accessorKey: 'vendorName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor Name" />
      ),
      cell: ({
        row: {
          original: { vendorName },
        },
      }) => vendorName?.toUpperCase(),
    },
    {
      accessorKey: 'orderId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="LPO #" />
      ),
    },
    {
      accessorKey: 'invoiceNo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({
        row: {
          original: { invoiceNo },
        },
      }) => invoiceNo?.toUpperCase(),
    },
    {
      accessorKey: 'store',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Receiving Store" />
      ),
      cell: ({
        row: {
          original: { store },
        },
      }) => store?.toUpperCase(),
    },
    {
      id: 'actions',
      cell: ({
        row: {
          original: { id },
        },
      }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem asChild>
              <Link href={`/store/grn/${id}/view`}>
                <ViewDetailsAction text="View Details" />
              </Link>
            </DropdownMenuItem>
            <ActionButton
              variant="ghost"
              className="px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0"
              action={handleDelete.bind(null, id.toString())}
              requireAreYouSure={true}
            >
              <DeleteAction />
            </ActionButton>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];
  return <DataTable columns={columns} data={grns} />;
}
