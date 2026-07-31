'use client';
import type { ColumnDef } from '@tanstack/react-table';

import Link from 'next/link';

import type { ProductTableRow } from '@/features/procurement/utils/procurement.types';

import {
  CheckButton,
  DeleteAction,
  EditAction,
} from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { DataTable } from '@/components/custom/datatable';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { CustomStatusBadge } from '@/components/custom/status-badges';
import { ActionButton } from '@/components/ui/action-button';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  deleteProduct,
  toggleProductState,
} from '@/features/procurement/services/products/actions';

export function ProductsDataTable({
  products,
}: {
  products: Array<ProductTableRow>;
}) {
  async function handleDelete(productId: string) {
    const response = await deleteProduct(productId);
    return { error: response.error, message: response.message };
  }
  async function handleToggle(productId: string) {
    await toggleProductState(productId);
  }

  const columns: Array<ColumnDef<ProductTableRow>> = [
    {
      accessorKey: 'productName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product Name" />
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => row.original.category.toUpperCase() || 'N/A',
    },
    {
      accessorKey: 'unit',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unit" />
      ),
      cell: ({ row }) => row.original.unit.toUpperCase(),
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
          original: { id, active },
        },
      }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem asChild>
              <Link href={`/procurement/products/${id}/edit`} prefetch={false}>
                <EditAction />
              </Link>
            </DropdownMenuItem>
            {!active && (
              <DropdownMenuItem onClick={() => handleToggle(id)}>
                <CheckButton text="Activate" />
              </DropdownMenuItem>
            )}
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
  return <DataTable data={products} columns={columns} denseCell />;
}
