'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/custom/datatable';
import { CustomStatusBadge } from '@/components/custom/status-badges';
import { dateFormat } from '@/lib/helpers/formatters';

type AssetHistoryRecord = {
  id: string;
  userId: string | null;
  userName: string | null;
  assignedDate: string;
  returnedDate: string | null;
  assignmentNotes: string | null;
  createdAt: Date;
};

export function AssetHistoryPage({
  assetName,
  rows,
}: {
  assetName: string;
  rows: Array<AssetHistoryRecord>;
}) {
  const columns: Array<ColumnDef<AssetHistoryRecord>> = [
    {
      accessorKey: 'userName',
      header: 'Assigned To',
      cell: ({ row }) => row.original.userName?.toUpperCase() ?? 'UNASSIGNED',
    },
    {
      accessorKey: 'assignedDate',
      header: 'Assigned',
      cell: ({ row }) => dateFormat(row.original.assignedDate, 'long'),
    },
    {
      accessorKey: 'returnedDate',
      header: 'Returned',
      cell: ({ row }) =>
        row.original.returnedDate
          ? dateFormat(row.original.returnedDate, 'long')
          : 'ACTIVE',
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.returnedDate ? (
          <CustomStatusBadge text="Closed" variant="info" />
        ) : (
          <CustomStatusBadge text="Active" variant="success" />
        ),
    },
    {
      accessorKey: 'assignmentNotes',
      header: 'Notes',
      cell: ({ row }) => row.original.assignmentNotes || 'N/A',
    },
    {
      accessorKey: 'createdAt',
      header: 'Logged On',
      cell: ({ row }) => dateFormat(row.original.createdAt, 'long'),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{assetName}</h2>
        <p className="text-sm text-muted-foreground">
          Assignment timeline for this asset.
        </p>
      </div>
      <DataTable columns={columns} data={rows} />
    </div>
  );
}
