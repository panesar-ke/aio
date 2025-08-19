'use client';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import type { MaterialRequisitionTableRow } from '@/features/procurement/utils/procurement.types';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { DataTable } from '@/components/custom/datatable';
import { dateFormat } from '@/lib/helpers/formatters';
import { CustomStatusBadge } from '@/components/custom/status-badges';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import {
  AutomateAction,
  DeleteAction,
  EditAction,
  ViewDetailsAction,
} from '@/components/custom/custom-button';
import { ActionButton } from '@/components/ui/action-button';
import { deleteRequisition } from '@/features/procurement/services/material-requisitions/action';

export function RequisitionsDataTable({
  data,
}: {
  data: Array<MaterialRequisitionTableRow>;
}) {
  const handleDelete = async (requisitionId: string) => {
    const response = await deleteRequisition(requisitionId);
    if (response.error) {
      return {
        error: true,
        message: response.message,
      };
    }

    return { error: false, message: 'Requisition deleted successfully' };
  };

  const columns: Array<ColumnDef<MaterialRequisitionTableRow>> = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Requisition #" />
      ),
    },
    {
      accessorKey: 'documentDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Document Date" />
      ),
      cell: ({ row }) => dateFormat(row.original.documentDate, 'long'),
    },
    {
      accessorKey: 'linked',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const linked = row.original.linked;
        return (
          <CustomStatusBadge
            variant={linked ? 'success' : 'warning'}
            text={linked ? 'LPO Raised' : 'LPO Pending'}
          />
        );
      },
    },
    {
      accessorKey: 'createdBy',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created By" />
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium capitalize">
            {row.original.user.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {dateFormat(row.original.createdOn, 'long')}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({
        row: {
          original: { linked, reference },
        },
      }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            {!linked && (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/procurement/material-requisition/${reference}/edit`}
                  >
                    <EditAction />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/procurement/purchase-order/new?requisition=${reference}`}
                  >
                    <AutomateAction text="Generate LPO" />
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem asChild>
              <Link
                href={`/procurement/material-requisition/${reference}/details`}
              >
                <ViewDetailsAction />
              </Link>
            </DropdownMenuItem>
            {!linked && (
              <ActionButton
                variant="ghost"
                className="px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0"
                action={handleDelete.bind(null, reference)}
                requireAreYouSure={true}
              >
                <DeleteAction />
              </ActionButton>
            )}
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];
  return <DataTable data={data} columns={columns} denseCell />;
}
