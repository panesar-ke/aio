'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { CheckCircleIcon } from 'lucide-react';
import Link from 'next/link';

import type { Lead } from '@/features/sales/utils/sales.types';
import type { LeadStatus } from '@/features/sales/utils/search-params';

import { PermissionGate } from '@/components/auth/client-permission-gate';
import { DeleteAction, EditAction } from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import CustomModal from '@/components/custom/custom-modal';
import { DataTable } from '@/components/custom/datatable';
import { MiniSelect } from '@/components/custom/mini-select';
import Search from '@/components/custom/search';
import { ActionButton } from '@/components/ui/action-button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useModal } from '@/features/integrations/modal-provider';
import { LoadConversionForm } from '@/features/sales/components/leads/lead-conversion';
import { useLeadsFilters } from '@/features/sales/hooks/leads/use-filters';
import { deleteLead } from '@/features/sales/services/leads/action';
import { LEAD_STATUS } from '@/features/sales/utils/constants';
import { dateFormat, titleCase } from '@/lib/helpers/formatters';

type LeadsPageProps = {
  leads: Array<Lead>;
};

export function LeadsClientPage({ leads }: LeadsPageProps) {
  const { setOpen } = useModal();

  const handleConvertToCustomer = (lead: Lead) => {
    setOpen(
      <CustomModal
        title='Convert Lead to Customer'
        subtitle='This creates a Customer record. The lead will be marked Converted.'
        className='max-w-xl!'
      >
        <LoadConversionForm lead={lead} />
      </CustomModal>,
    );
  };

  const columns: Array<ColumnDef<Lead>> = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => titleCase(row.original.name.toLowerCase()),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => titleCase(row.original.company.toLowerCase()),
    },
    {
      accessorKey: 'leadSource',
      header: 'Lead Source',
      cell: ({
        row: {
          original: { leadSource },
        },
      }) => (leadSource ? titleCase(leadSource.toLowerCase()) : undefined),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === 'lost'
                ? 'destructive'
                : status === 'new'
                  ? 'info'
                  : status === 'qualified'
                    ? 'success'
                    : 'outline'
            }
          >
            {titleCase(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created Date',
      cell: ({ row }) => dateFormat(row.original.createdAt, 'long'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <DropdownMenu>
            <CustomDropdownTrigger />
            <CustomDropdownContent>
              <DropdownMenuItem asChild>
                <Link href={`/sales/leads/${id}/edit`}>
                  <EditAction />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleConvertToCustomer(row.original)}
              >
                <CheckCircleIcon className='size-3 text-muted-foreground' />
                <span className='text-xs'>Convert to Customer</span>
              </DropdownMenuItem>
              <PermissionGate permissions={['sales:admin']}>
                <ActionButton
                  variant='ghost'
                  className='px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0'
                  action={async () => deleteLead(id)}
                  requireAreYouSure={true}
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
  return (
    <div className='space-y-6'>
      <LeadsFilters />
      <DataTable columns={columns} data={leads} />
    </div>
  );
}

function LeadsFilters() {
  const { filters, onHandleSearch, onLeadStatusChange } = useLeadsFilters();
  return (
    <div className='grid md:grid-cols-2 gap-4'>
      <Search
        placeholder='Search leads....'
        className='flex-1'
        defaultValue={filters.search}
        onHandleSearch={onHandleSearch}
      />
      <MiniSelect
        options={[{ value: 'all', label: 'All' }, ...LEAD_STATUS]}
        onChange={(val) => onLeadStatusChange(val as LeadStatus)}
        withForm={false}
        className='bg-background sm:w-56'
        defaultValue={filters.status}
      />
    </div>
  );
}
