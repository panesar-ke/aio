'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/custom/datatable';
import type { VendorTableRow } from '@/features/procurement/utils/procurement.types';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { CustomStatusBadge } from '@/components/custom/status-badges';
import { compactNumberFormatter } from '@/lib/helpers/formatters';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import {
  DeleteAction,
  EditAction,
  ViewDetailsAction,
} from '@/components/custom/custom-button';
import { ActionButton } from '@/components/ui/action-button';
import { deleteVendor } from '@/features/procurement/services/vendors/actions';

export function VendorsDatatable({ vendors }: { vendors: VendorTableRow[] }) {
  async function handleDelete(id: string) {
    const response = await deleteVendor(id);
    return { error: response.error, message: response.message };
  }
  const columns: Array<ColumnDef<VendorTableRow>> = [
    {
      accessorKey: 'vendorName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor Name" />
      ),
      cell: ({ row }) => (
        <div className="uppercase">{row.original.vendorName}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      accessorKey: 'contact',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
    },
    {
      accessorKey: 'active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Active" />
      ),
      cell: ({ row }) => (
        <CustomStatusBadge
          variant={row.original.active ? 'success' : 'warning'}
          text={row.original.active ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      accessorKey: 'totalSpend',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Spend" />
      ),
      cell: ({ row }) => {
        const totalOrderSum = row.original.totalOrderSum;
        const totalOrderCount = row.original.totalOrders;
        return (
          <div className="space-y-1">
            <div className="font-semibold">
              {totalOrderSum
                ? `Ksh ${compactNumberFormatter(totalOrderSum)}`
                : '-'}
            </div>
            <span className="text-xs italic text-muted-foreground">
              {totalOrderCount ? `${totalOrderCount} orders` : 'No orders yet'}
            </span>
          </div>
        );
      },
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
              <Link href={`/procurement/vendors/${id}/edit`}>
                <EditAction />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/procurement/vendors/${id}/overview`}>
                <ViewDetailsAction text="Vendor Overview" />
              </Link>
            </DropdownMenuItem>
            <ActionButton
              variant="ghost"
              className="px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0"
              action={handleDelete.bind(null, id)}
              requireAreYouSure={true}
            >
              <DeleteAction />
            </ActionButton>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];
  return <DataTable data={vendors} columns={columns} denseCell />;
}
