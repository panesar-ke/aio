'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { useSuspenseQuery } from '@tanstack/react-query';
import { RefreshCcwIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { LicenseStatus, LicenseType } from '@/drizzle/schema';

import { ViewDetailsAction } from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import CustomModal from '@/components/custom/custom-modal';
import { DataTable } from '@/components/custom/datatable';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { MiniSelect } from '@/components/custom/mini-select';
import Search from '@/components/custom/search';
import { CustomStatusBadge } from '@/components/custom/status-badges';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty';
import { LICENSE_STATUS } from '@/drizzle/schema';
import { useModal } from '@/features/integrations/modal-provider';
import { LicenseRenewalForm } from '@/features/it/licenses/components/license-renewal-form';
import { dateFormat, titleCase } from '@/lib/helpers/formatters';
import { type Option } from '@/types/index.types';

import { type Status, useLicenseFilters } from '../hooks/use-license-filters';

type LicenseQueryParams = {
  search?: string;
  status?: Status | null;
};

export type License = {
  id: string;
  name: string;
  status: LicenseStatus;
  licenseType: LicenseType;
  latestRenewalDate: string | null;
  latestEndDate: string | null;
};

async function fetchLicenses(
  params: LicenseQueryParams,
): Promise<Array<License>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.status) searchParams.append('status', params.status);

  const response = await fetch(`/api/it/licenses?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

export function LicensePage({ vendors }: { vendors: Array<Option> }) {
  const { filters, onHandleSearch, onStatusChange } = useLicenseFilters();
  return (
    <div className="flex flex-col gap-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Search
          placeholder="Search license..."
          onHandleSearch={onHandleSearch}
          defaultValue={filters.search}
        />
        <MiniSelect
          options={[
            { value: 'all', label: 'All' },
            ...LICENSE_STATUS.map(l => ({ value: l, label: titleCase(l) })),
          ]}
          defaultValue={filters.status ?? undefined}
          withForm={false}
          onChange={val => onStatusChange(val as Status)}
          className="bg-background"
          placeholder="Filter by status"
        />
      </div>
      <ErrorBoundaryWithSuspense>
        <LicenseTable vendors={vendors} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

function LicenseTable({ vendors }: { vendors: Array<Option> }) {
  const { filters, onReset } = useLicenseFilters();
  const router = useRouter();
  const { data } = useSuspenseQuery({
    queryKey: ['it-licenses', filters],
    queryFn: () => fetchLicenses(filters),
  });

  const { setOpen } = useModal();

  const hasFilters = Boolean(filters.search?.trim()) || Boolean(filters.status);

  if (data.length === 0) {
    return (
      <EmptyState
        title={
          !hasFilters
            ? 'No licenses created yet!'
            : 'No licenses found matching your criteria'
        }
        description={
          !hasFilters
            ? 'Get started by creating your first license.'
            : 'Try adjusting your filters to find licenses.'
        }
        variant={!hasFilters ? 'default' : 'search'}
        action={{
          label: hasFilters ? 'Clear filters' : 'Create License',
          variant: hasFilters ? 'outline' : 'default',
          onClick: () => {
            if (hasFilters) {
              onReset();
              return;
            }

            router.push('/it/licenses/new');
          },
        }}
      />
    );
  }

  function handleLicenseRenewal(licenseId: string) {
    setOpen(
      <CustomModal title="License Renewal" className="max-w-2xl!">
        <LicenseRenewalForm licenseId={licenseId} vendors={vendors} />
      </CustomModal>,
    );
  }

  const columns: Array<ColumnDef<License>> = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.original.name.toUpperCase(),
    },
    {
      accessorKey: 'licenseType',
      header: 'License Type',
      cell: ({
        row: {
          original: { licenseType },
        },
      }) => licenseType.toUpperCase(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <CustomStatusBadge
            variant={
              status === 'active'
                ? 'success'
                : status === 'expired'
                  ? 'error'
                  : status === 'cancelled'
                    ? 'warning'
                    : 'info'
            }
            text={status.toUpperCase()}
          />
        );
      },
    },
    {
      accessorKey: 'latestRenewalDate',
      header: 'Last Renewal Date',
      cell: ({
        row: {
          original: { latestRenewalDate },
        },
      }) => {
        if (!latestRenewalDate) return null;
        return dateFormat(latestRenewalDate, 'long');
      },
    },
    {
      accessorKey: 'latestEndDate',
      header: 'End Date',
      cell: ({
        row: {
          original: { latestEndDate },
        },
      }) => {
        if (!latestEndDate) return null;
        return dateFormat(latestEndDate, 'long');
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
            <DropdownMenuItem onSelect={() => handleLicenseRenewal(id)}>
              <RefreshCcwIcon className="size-3 text-muted-foreground" />
              <span className="text-xs">Renew License</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/it/licenses/${id}/history`}>
                <ViewDetailsAction text="Renewal History" />
              </Link>
            </DropdownMenuItem>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
