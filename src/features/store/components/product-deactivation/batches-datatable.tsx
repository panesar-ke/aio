'use client';
import type { ColumnDef } from '@tanstack/react-table';

import Link from 'next/link';

import type { getDeactivationBatches } from '@/features/store/services/product-deactivation/data';

import { ViewDetailsAction } from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { DataTable } from '@/components/custom/datatable';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { dateFormat } from '@/lib/helpers/formatters';

type BatchRow = Awaited<ReturnType<typeof getDeactivationBatches>>[number];

export function BatchesDatatable({ batches }: { batches: Array<BatchRow> }) {
  const columns: Array<ColumnDef<BatchRow>> = [
    {
      accessorKey: 'deactivationDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Run Date" />
      ),
      cell: ({ row }) => dateFormat(row.original.deactivationDate, 'long'),
    },
    {
      accessorKey: 'thresholdDays',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Threshold (days)" />
      ),
    },
    {
      accessorKey: 'totalCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Items" />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem asChild>
              <Link
                href={`/store/deactivated-items/${row.original.id}`}
                prefetch={false}
              >
                <ViewDetailsAction text="View Details" />
              </Link>
            </DropdownMenuItem>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={batches} />;
}
