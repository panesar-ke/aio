'use client';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';

import type { getDeactivationBatch } from '@/features/store/services/product-deactivation/data';

import { DataTable } from '@/components/custom/datatable';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { CustomStatusBadge } from '@/components/custom/status-badges';
import { ToastContent } from '@/components/custom/toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  excludeProductFromAutoDeactivation,
  reactivateItems,
} from '@/features/store/services/product-deactivation/review-actions';
import { dateFormat, numberFormat } from '@/lib/helpers/formatters';

type Batch = NonNullable<Awaited<ReturnType<typeof getDeactivationBatch>>>;
type ItemRow = Batch['items'][number];

export function BatchItemsDatatable({ items }: { items: Array<ItemRow> }) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isReactivating, startReactivating] = useTransition();
  const [excludingId, setExcludingId] = useState<string | null>(null);

  function handleBulkReactivate() {
    const itemIds = Object.keys(rowSelection).filter(id => rowSelection[id]);

    if (itemIds.length === 0) {
      return;
    }

    startReactivating(async () => {
      const result = await reactivateItems(itemIds);
      if (result.error) {
        toast.error(() => (
          <ToastContent title="Something went wrong" message={result.message} />
        ));
        return;
      }
      setRowSelection({});
    });
  }

  async function handleExclude(productId: string) {
    setExcludingId(productId);
    const result = await excludeProductFromAutoDeactivation(productId);
    setExcludingId(null);
    if (result.error) {
      toast.error(() => (
        <ToastContent title="Something went wrong" message={result.message} />
      ));
    }
  }

  const columns: Array<ColumnDef<ItemRow>> = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          disabled={row.original.reactivated}
          aria-label="Select row"
        />
      ),
    },
    {
      id: 'productName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => row.original.product?.productName?.toUpperCase(),
    },
    {
      id: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) =>
        row.original.product?.productCategory?.categoryName?.toUpperCase(),
    },
    {
      accessorKey: 'lastUsedDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Used" />
      ),
      cell: ({ row }) =>
        row.original.lastUsedDate
          ? dateFormat(row.original.lastUsedDate, 'long')
          : 'Never',
    },
    {
      accessorKey: 'lastUsedSource',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source" />
      ),
    },
    {
      accessorKey: 'balanceAtDeactivation',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balance" />
      ),
      cell: ({ row }) => {
        const balance = Number(row.original.balanceAtDeactivation ?? 0);
        return balance !== 0 ? (
          <CustomStatusBadge variant="warning" text={numberFormat(balance)} />
        ) : (
          numberFormat(balance)
        );
      },
    },
    {
      accessorKey: 'reactivated',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) =>
        row.original.reactivated ? (
          <CustomStatusBadge variant="success" text="Reactivated" />
        ) : (
          <CustomStatusBadge variant="error" text="Deactivated" />
        ),
    },
    {
      id: 'exclude',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={excludingId === row.original.productId}
          onClick={() => handleExclude(row.original.productId)}
        >
          Exclude from future checks
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Button
        disabled={isReactivating || Object.keys(rowSelection).length === 0}
        onClick={handleBulkReactivate}
      >
        Reactivate selected
      </Button>
      <DataTable
        columns={columns}
        data={items}
        enableRowSelection={row => !row.original.reactivated}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={row => row.id}
      />
    </div>
  );
}
