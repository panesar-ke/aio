"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DownloadIcon } from "lucide-react";

import { DataTable } from "@/components/custom/datatable";
import { DataTableColumnHeader } from "@/components/custom/datatable-column-header";
import { CustomStatusBadge } from "@/components/custom/status-badges";
import { Button } from "@/components/ui/button";
import {
  type ImportBatchListItem,
  useImportBatches,
} from "@/features/procurement/hooks/use-import-batches";

const STATUS_VARIANT: Record<
  ImportBatchListItem["status"],
  "success" | "warning" | "error" | "info"
> = {
  queued: "info",
  processing: "warning",
  completed: "success",
  completed_with_errors: "warning",
  failed: "error",
};

const STATUS_LABEL: Record<ImportBatchListItem["status"], string> = {
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  completed_with_errors: "Completed with errors",
  failed: "Failed",
};

interface RecentImportsTableProps {
  initialData: Array<ImportBatchListItem>;
}

export function RecentImportsTable({ initialData }: RecentImportsTableProps) {
  const { data } = useImportBatches(initialData);
  const batches = data?.batches ?? initialData;

  const columns: Array<ColumnDef<ImportBatchListItem>> = [
    {
      accessorKey: "fileName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="File" />,
    },
    {
      accessorKey: "storeName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Store" />,
    },
    {
      accessorKey: "asOfDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="As-Of Date" />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <CustomStatusBadge
          variant={STATUS_VARIANT[row.original.status]}
          text={STATUS_LABEL[row.original.status]}
        />
      ),
    },
    {
      id: "rows",
      header: "Rows",
      cell: ({ row }) =>
        `${row.original.successRows}/${row.original.totalRows} ok, ${row.original.failedRows} failed`,
    },
    {
      accessorKey: "uploadedByName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded By" />,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded At" />,
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      id: "actions",
      cell: ({ row }) =>
        row.original.failedRows > 0 ? (
          <Button variant="ghost" size="sm" asChild>
            <a href={`/api/procurement/products/import/${row.original.id}/errors`} download>
              <DownloadIcon className="size-4" />
              Error report
            </a>
          </Button>
        ) : null,
    },
  ];

  return <DataTable data={batches} columns={columns} />;
}
