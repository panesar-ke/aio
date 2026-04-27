'use client';

import type { ColumnDef } from '@tanstack/react-table';

import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  BanIcon,
  CornerDownLeftIcon,
  HandHelpingIcon,
  ShredderIcon,
  WrenchIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { Option } from '@/types/index.types';

import { PermissionGate } from '@/components/auth/client-permission-gate';
import {
  DeleteAction,
  EditAction,
  ViewDetailsAction,
} from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import CustomModal from '@/components/custom/custom-modal';
import { DataTable } from '@/components/custom/datatable';
import { DatePicker } from '@/components/custom/date-range';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import Search from '@/components/custom/search';
import { CustomStatusBadge } from '@/components/custom/status-badges';
import { ActionButton } from '@/components/ui/action-button';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useModal } from '@/features/integrations/modal-provider';
import { AssignmentForm } from '@/features/it/assets/components/assignment-form';
import { useAssetFilters } from '@/features/it/assets/hooks/use-asset-filters';
import {
  changeAssetStatus,
  deleteAsset,
  returnAsset,
} from '@/features/it/assets/services/actions';
import {
  dateFormat,
  numberFormat,
  reportCaseFormatter,
} from '@/lib/helpers/formatters';

type Asset = {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: string | null;
  status: string;
  condition: string;
  department: string | null;
  assignedUser: string | null;
  vendor: string | null;
};

type AssetPageProps = {
  categories: Array<{ id: string; name: string }>;
  departments: Array<Option>;
  assignableUsers: Array<Option>;
  assignableAssets: Array<Option>;
};

type AssetQueryParams = {
  search?: string | null;
  from?: string | null;
  to?: string | null;
  status?: string | null;
  condition?: string | null;
  categoryId?: string | null;
  departmentId?: string | null;
};

const statusBadgeMap: Record<
  string,
  { text: string; variant: 'success' | 'warning' | 'error' | 'info' }
> = {
  in_stock: { text: 'In stock', variant: 'info' },
  assigned: { text: 'Assigned', variant: 'success' },
  in_repair: { text: 'In repair', variant: 'warning' },
  retired: { text: 'Retired', variant: 'error' },
  disposed: { text: 'Disposed', variant: 'error' },
  lost: { text: 'Lost', variant: 'error' },
};

async function fetchAssets(params?: AssetQueryParams): Promise<Array<Asset>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.from) searchParams.append('from', params.from);
  if (params?.to) searchParams.append('to', params.to);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.condition) searchParams.append('condition', params.condition);
  if (params?.categoryId) searchParams.append('categoryId', params.categoryId);
  if (params?.departmentId) {
    searchParams.append('departmentId', String(params.departmentId));
  }

  const response = await fetch(`/api/it/assets?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

export const assetQueries = (params?: AssetQueryParams) =>
  queryOptions({
    queryKey: ['it-assets', params],
    queryFn: () => fetchAssets(params),
  });

export function AssetPage({
  categories,
  departments,
  assignableUsers,
  assignableAssets,
}: AssetPageProps) {
  const { filters, onDateChange, onFilterChange, onHandleSearch, onReset } =
    useAssetFilters();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Search
          onHandleSearch={onHandleSearch}
          defaultValue={filters.search}
          placeholder="Search name, serial, vendor, assignee..."
          key={filters.search}
          parentClassName="md:col-span-2 lg:col-span-2"
        />
        <Select
          value={filters.status || '__all__'}
          onValueChange={value => onFilterChange('status', value)}
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            <SelectItem value="in_stock">In stock</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_repair">In repair</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.condition || '__all__'}
          onValueChange={value => onFilterChange('condition', value)}
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Filter by condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All conditions</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="refurbished">Refurbished</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          value={filters.categoryId || '__all__'}
          onValueChange={value => onFilterChange('categoryId', value)}
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.departmentId || '__all__'}
          onValueChange={value => onFilterChange('departmentId', value)}
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All departments</SelectItem>
            {departments.map(department => (
              <SelectItem key={department.value} value={department.value}>
                {department.label.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      </div>

      <ErrorBoundaryWithSuspense errorMessage="Failed to fetch assets. Please try again.">
        <AssetTable
          assignableAssets={assignableAssets}
          assignableUsers={assignableUsers}
        />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

function AssetTable({
  assignableUsers,
  assignableAssets,
}: {
  assignableUsers: Array<Option>;
  assignableAssets: Array<Option>;
}) {
  const { setOpen } = useModal();
  const { filters, onReset } = useAssetFilters();
  const { data } = useSuspenseQuery(assetQueries(filters));
  const queryClient = useQueryClient();
  const router = useRouter();
  const hasFilters = Object.values(filters).some(
    value => value !== null && value !== '',
  );

  const columns: Array<ColumnDef<(typeof data)[0]>> = [
    {
      accessorKey: 'name',
      header: 'Asset',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {(row.original.brand ?? '').toUpperCase()}{' '}
            {(row.original.model ?? '').toUpperCase()}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category.toUpperCase(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = statusBadgeMap[row.original.status] ?? {
          text: row.original.status,
          variant: 'info' as const,
        };

        return (
          <CustomStatusBadge text={status.text} variant={status.variant} />
        );
      },
    },
    {
      accessorKey: 'condition',
      header: 'Condition',
      cell: ({ row }) => reportCaseFormatter(row.original.condition),
    },
    {
      accessorKey: 'purchaseDate',
      header: 'Purchase Date',
      cell: ({ row }) =>
        row.original.purchaseDate
          ? dateFormat(row.original.purchaseDate, 'long')
          : 'N/A',
    },
    {
      accessorKey: 'purchaseCost',
      header: 'Cost',
      cell: ({ row }) =>
        row.original.purchaseCost
          ? numberFormat(row.original.purchaseCost)
          : 'N/A',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const isAssigned = row.original.status === 'assigned';

        return (
          <DropdownMenu>
            <CustomDropdownTrigger />
            <CustomDropdownContent>
              <DropdownMenuItem asChild>
                <Link href={`/it/assets/registry/${row.original.id}/edit`}>
                  <EditAction />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setOpen(
                    <CustomModal
                      title={isAssigned ? 'Reassign Asset' : 'Assign Asset'}
                      subtitle={`Asset: ${row.original.name}`}
                    >
                      <AssignmentForm
                        users={assignableUsers}
                        assets={assignableAssets}
                        initialValues={{ assetId: row.original.id }}
                      />
                    </CustomModal>,
                  )
                }
              >
                <>
                  <HandHelpingIcon className="size-3 text-muted-foreground" />
                  <span className="text-xs">
                    {isAssigned ? 'Reassign' : 'Assign'}
                  </span>
                </>
              </DropdownMenuItem>
              {isAssigned && (
                <ActionButton
                  variant="ghost"
                  className="px-1.5 py-1.5 justify-start h-auto w-full flex"
                  action={returnAsset.bind(null, row.original.id)}
                  requireAreYouSure={true}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['it-assets'] });
                    queryClient.invalidateQueries({
                      queryKey: ['it-asset-assignments'],
                    });
                  }}
                >
                  <>
                    <CornerDownLeftIcon className="size-3 text-muted-foreground" />
                    <span className="text-xs">Return Asset</span>
                  </>
                </ActionButton>
              )}
              <PermissionGate permissions={['it:admin']} match="all">
                <ActionButton
                  variant="ghost"
                  className="px-1.5 py-1.5 justify-start h-auto w-full flex"
                  action={() =>
                    changeAssetStatus({
                      id: row.original.id,
                      status: 'in_repair',
                    })
                  }
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['it-assets'] });
                  }}
                >
                  <>
                    <WrenchIcon className="size-3 text-muted-foreground" />
                    <span className="text-xs">Set In Repair</span>
                  </>
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  className="px-1.5 py-1.5 justify-start h-auto w-full flex"
                  action={() =>
                    changeAssetStatus({
                      id: row.original.id,
                      status: 'retired',
                    })
                  }
                  requireAreYouSure={true}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['it-assets'] });
                  }}
                >
                  <>
                    <BanIcon className="size-3 text-muted-foreground -ml-1" />
                    <span className="text-xs">Retire</span>
                  </>
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  className="px-1.5 py-1.5 justify-start h-auto w-full flex"
                  action={() =>
                    changeAssetStatus({
                      id: row.original.id,
                      status: 'disposed',
                    })
                  }
                  requireAreYouSure={true}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['it-assets'] });
                  }}
                >
                  <>
                    <ShredderIcon className="size-3 text-muted-foreground -ml-1" />
                    <span className="text-xs">Dispose</span>
                  </>
                </ActionButton>
              </PermissionGate>
              <DropdownMenuItem asChild>
                <Link href={`/it/assets/registry/${row.original.id}/history`}>
                  <ViewDetailsAction text="History" />
                </Link>
              </DropdownMenuItem>
              <PermissionGate permissions={['it:admin']} match="all">
                <ActionButton
                  variant="ghost"
                  className="px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20"
                  action={deleteAsset.bind(null, row.original.id)}
                  requireAreYouSure={true}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['it-assets'] });
                  }}
                >
                  <DeleteAction />
                </ActionButton>
              </PermissionGate>
            </CustomDropdownContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (data.length === 0) {
    return (
      <EmptyState
        title={
          !hasFilters
            ? 'No assets registered yet'
            : 'No assets found matching your filters'
        }
        description={
          !hasFilters
            ? 'Get started by registering your first IT asset.'
            : 'Try adjusting your filters to find assets.'
        }
        variant={!hasFilters ? 'default' : 'search'}
        action={{
          label: hasFilters ? 'Clear filters' : 'Create Asset',
          variant: hasFilters ? 'outline' : 'default',
          onClick: () => {
            if (hasFilters) {
              onReset();
              return;
            }

            router.push('/it/assets/registry/new');
          },
        }}
      />
    );
  }

  return <DataTable columns={columns} data={data} />;
}
