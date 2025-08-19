'use client';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import type { Service } from '@/features/procurement/utils/procurement.types';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { DataTable } from '@/components/custom/datatable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { DeleteAction, EditAction } from '@/components/custom/custom-button';
import { ActionButton } from '@/components/ui/action-button';
import { deleteService } from '@/features/procurement/services/services/actions';
import { CustomStatusBadge } from '@/components/custom/status-badges';

export function ServicesDataTable({ services }: { services: Array<Service> }) {
  async function handleDelete(serviceId: string) {
    const response = await deleteService(serviceId);
    return { error: response.error, message: response.message };
  }

  const columns: Array<ColumnDef<Service>> = [
    {
      accessorKey: 'serviceName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Service Name" />
      ),
      cell: ({
        row: {
          original: { serviceName },
        },
      }) => serviceName.toUpperCase(),
    },
    {
      accessorKey: 'active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isActive = Boolean(row.original.active);
        return (
          <CustomStatusBadge
            variant={isActive ? 'success' : 'warning'}
            text={isActive ? 'Active' : 'Inactive'}
          />
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
              <Link href={`/procurement/services/${id}/edit`}>
                <EditAction />
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
  return <DataTable data={services} columns={columns} />;
}
