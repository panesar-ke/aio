'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';

import type { AssetAssignmentsSearchParamsSchema } from '@/features/it/assets/utils/schemas';
import type { Option } from '@/types/index.types';

import { ViewDetailsAction } from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { DataTable } from '@/components/custom/datatable';
import { DatePicker } from '@/components/custom/date-range';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import Search from '@/components/custom/search';
import { CustomStatusBadge } from '@/components/custom/status-badges';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAssetAssignmentFilters } from '@/features/it/assets/hooks/use-asset-filters';
import { dateFormat } from '@/lib/helpers/formatters';

type AssignmentRow = {
  id: string;
  assetId: string;
  assetName: string;
  assetAssignmentCustodyType: 'user' | 'department';
  userId: string | null;
  userName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  assignedDate: string;
  returnedDate: string | null;
  assignmentNotes: string | null;
};

type AssignmentsPageProps = {
  assets: Array<Option>;
  users: Array<Option>;
  departments: Array<Option>;
};

async function fetchAssignments(
  params?: AssetAssignmentsSearchParamsSchema,
): Promise<Array<AssignmentRow>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.from) searchParams.append('from', params.from);
  if (params?.to) searchParams.append('to', params.to);
  if (params?.assetId) searchParams.append('assetId', params.assetId);
  if (params?.custodyType)
    searchParams.append('custodyType', params.custodyType);
  if (params?.userId) searchParams.append('userId', params.userId);
  if (params?.departmentId) {
    searchParams.append('departmentId', params.departmentId);
  }

  const response = await fetch(
    `/api/it/asset-assignments?${searchParams.toString()}`,
  );
  if (!response.ok) throw new Error('Failed to fetch assignments');
  return response.json();
}

export const assignmentQueries = (
  params?: AssetAssignmentsSearchParamsSchema,
) =>
  queryOptions({
    queryKey: ['it-asset-assignments', params],
    queryFn: () => fetchAssignments(params),
  });

export function AssignmentsPage({
  assets,
  users,
  departments,
}: AssignmentsPageProps) {
  const { filters, onDateChange, onFilterChange, onHandleSearch, onReset } =
    useAssetAssignmentFilters();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Search
          onHandleSearch={onHandleSearch}
          defaultValue={filters.search}
          placeholder="Search asset, user, notes..."
          key={filters.search}
          parentClassName="md:col-span-2"
        />
        <Select
          value={filters.assetId || '__all__'}
          onValueChange={value => onFilterChange('assetId', value)}
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Filter by asset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All assets</SelectItem>
            {assets.map(asset => (
              <SelectItem key={asset.value} value={asset.value}>
                {asset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.custodyType || '__all__'}
          onValueChange={value => {
            onFilterChange('custodyType', value);
            if (value === 'department') onFilterChange('userId', '__all__');
            if (value === 'user') onFilterChange('departmentId', '__all__');
          }}
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Filter by custody" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All custody types</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="department">Department</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.userId || '__all__'}
          onValueChange={value => onFilterChange('userId', value)}
          disabled={filters.custodyType === 'department'}
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All users</SelectItem>
            {users.map(user => (
              <SelectItem key={user.value} value={user.value}>
                {user.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.departmentId || '__all__'}
          onValueChange={value => onFilterChange('departmentId', value)}
          disabled={filters.custodyType === 'user'}
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All departments</SelectItem>
            {departments.map(department => (
              <SelectItem key={department.value} value={department.value}>
                {department.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DatePicker
        onDateChange={date => {
          onDateChange({
            from: date.from || null,
            to: date.to || null,
          });
        }}
        onReset={onReset}
        initialDateRange={{
          from: filters.from ? new Date(filters.from) : undefined,
          to: filters.to ? new Date(filters.to) : undefined,
        }}
      />
      <ErrorBoundaryWithSuspense errorMessage="Failed to fetch assignment history.">
        <AssignmentsTable />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

function AssignmentsTable() {
  const { filters } = useAssetAssignmentFilters();
  const { data } = useSuspenseQuery(
    assignmentQueries({
      ...filters,
      custodyType:
        filters.custodyType as AssetAssignmentsSearchParamsSchema['custodyType'],
    }),
  );

  const columns: Array<ColumnDef<AssignmentRow>> = [
    {
      accessorKey: 'assetName',
      header: 'Asset',
      cell: ({ row }) => row.original.assetName,
    },
    {
      accessorKey: 'userName',
      header: 'Assigned To',
      cell: ({ row }) => {
        if (row.original.assetAssignmentCustodyType === 'department') {
          return row.original.departmentName?.toUpperCase() ?? 'UNASSIGNED';
        }

        return row.original.userName?.toUpperCase() ?? 'UNASSIGNED';
      },
    },
    {
      accessorKey: 'assetAssignmentCustodyType',
      header: 'Custody',
      cell: ({ row }) =>
        row.original.assetAssignmentCustodyType === 'department'
          ? 'DEPARTMENT'
          : 'USER',
    },
    {
      accessorKey: 'assignedDate',
      header: 'Assigned Date',
      cell: ({ row }) => dateFormat(row.original.assignedDate, 'long'),
    },
    {
      accessorKey: 'returnedDate',
      header: 'Returned Date',
      cell: ({ row }) =>
        row.original.returnedDate
          ? dateFormat(row.original.returnedDate, 'long')
          : 'ACTIVE',
    },
    {
      accessorKey: 'status',
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
      cell: ({ row }) => row.original.assignmentNotes ?? 'N/A',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem asChild>
              <Link
                href={`/it/assets/registry/${row.original.assetId}/history`}
              >
                <ViewDetailsAction text="Asset History" />
              </Link>
            </DropdownMenuItem>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
