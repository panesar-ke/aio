'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import type { Store } from '@/features/store/utils/store.types';
import { DataTable } from '@/components/custom/datatable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { DeleteAction, EditAction } from '@/components/custom/custom-button';
import { ActionButton } from '@/components/ui/action-button';
import { deleteStore } from '@/features/store/services/stores/actions';

export function StoresDatatable({ stores }: { stores: Array<Store> }) {
  async function handleDelete(storeId: string) {
    const response = await deleteStore(storeId);
    return { error: response.error, message: response.message };
  }
  const columns: Array<ColumnDef<Store>> = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row: { original } }) => (
        <span>{original.storeName.toUpperCase()}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row: { original } }) => (
        <span>{original.description.toUpperCase()}</span>
      ),
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
              <Link href={`/store/stores/${id}/edit`}>
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
  return <DataTable data={stores} columns={columns} />;
}
