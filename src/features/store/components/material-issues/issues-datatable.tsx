'use client';

import type { ColumnDef } from '@tanstack/react-table';

import Link from 'next/link';

import type { getMaterialIssues } from '@/features/store/services/issues/data';

import { DeleteAction, EditAction } from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { DataTable } from '@/components/custom/datatable';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { ActionButton } from '@/components/ui/action-button';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { deleteIssue } from '@/features/store/services/issues/actions';
import { dateFormat } from '@/lib/helpers/formatters';

type MaterialIssueRow = Awaited<ReturnType<typeof getMaterialIssues>>[number];

export function MaterialIssuesDatatable({
  data,
}: {
  data: Array<MaterialIssueRow>;
}) {
  async function handleDelete(issueId: string) {
    const response = await deleteIssue(issueId);
    return { error: response.error, message: response.message };
  }
  const columns: Array<ColumnDef<MaterialIssueRow>> = [
    {
      accessorKey: 'issueNo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Issue No" />
      ),
    },
    {
      accessorKey: 'issueDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Issue Date" />
      ),
      cell: ({
        row: {
          original: { issueDate },
        },
      }) => dateFormat(issueDate, 'long'),
    },
    {
      accessorKey: 'jobcardNo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Job Card No" />
      ),
    },
    {
      accessorKey: 'staffName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Staff Issued" />
      ),
      cell: ({
        row: {
          original: { staffName },
        },
      }) => staffName?.toUpperCase() ?? 'N/A',
    },
    {
      accessorKey: 'store',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Issued From" />
      ),
      cell: ({
        row: {
          original: { store },
        },
      }) => store?.toUpperCase() ?? 'N/A',
    },
    {
      id: 'actions',

      cell: ({ row }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem asChild>
              <Link
                href={`/store/issues/${row.original.id}/edit`}
                prefetch={false}
              >
                <EditAction />
              </Link>
            </DropdownMenuItem>
            <ActionButton
              variant="ghost"
              className="px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0"
              action={handleDelete.bind(null, row.original.id)}
              requireAreYouSure={true}
            >
              <DeleteAction />
            </ActionButton>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];
  return <DataTable data={data} columns={columns} />;
}
