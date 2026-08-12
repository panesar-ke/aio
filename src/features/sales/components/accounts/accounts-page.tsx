'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { EyeIcon } from 'lucide-react';
import Link from 'next/link';

import { EditAction } from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { DataTable } from '@/components/custom/datatable';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { MiniSelect } from '@/components/custom/mini-select';
import Search from '@/components/custom/search';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAccountsFilters } from '@/features/sales/hooks/leads/use-filters';
import { ACCOUNT_TIERS, LAST_PURCHASE } from '@/features/sales/utils/constants';
import { type AccountWithValueAndLastDateOfPurchase } from '@/features/sales/utils/sales.types';
import { AccountTier } from '@/features/sales/utils/search-params';
import {
  compactNumberFormatter,
  dateFormat,
  titleCase,
} from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

function getSpendTier(value: number) {
  if (value >= 1000000) return AccountTier.high;
  if (value >= 100000) return AccountTier.medium;
  return AccountTier.low;
}

export function getAccountIdentity(company: string, name: string) {
  const formattedCompany = titleCase(company.trim().toLowerCase());
  const formattedName = titleCase(name.trim().toLowerCase());
  const showSecondaryName = formattedCompany !== formattedName;

  return {
    formattedCompany,
    formattedName,
    showSecondaryName,
  };
}

export function ClientAccountsPage({
  accounts,
}: {
  accounts: Array<AccountWithValueAndLastDateOfPurchase>;
}) {
  const columns: Array<ColumnDef<AccountWithValueAndLastDateOfPurchase>> = [
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Company' />
      ),
      cell: ({ row }) => {
        const { formattedCompany, formattedName, showSecondaryName } =
          getAccountIdentity(row.original.company, row.original.name);

        return (
          <div className='flex flex-col gap-0.5'>
            <div className='text-sm font-medium'>{formattedCompany}</div>
            <div
              className={cn(
                'text-xs text-muted-foreground',
                !showSecondaryName && 'invisible',
              )}
              aria-hidden={!showSecondaryName}
            >
              {showSecondaryName ? formattedName : '\u00A0'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'totalPurchaseValue',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Total Purchase Value' />
      ),
      cell: ({ row }) => {
        const purchaseValue = row.original.totalPurchaseValue;
        if (+purchaseValue === 0) return 'No purchases yet';
        const tier = getSpendTier(purchaseValue);
        return (
          <div className='flex items-center gap-2'>
            <SpendTierDot tier={tier} />
            <span>{compactNumberFormatter(purchaseValue)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'lastPurchaseDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Last Purchase Date' />
      ),
      cell: ({
        row: {
          original: { lastPurchaseDate },
        },
      }) => {
        return lastPurchaseDate
          ? dateFormat(lastPurchaseDate, 'long')
          : 'No purchases yet';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem asChild>
              <Link href={`/sales/accounts/${row.original.id}/details`}>
                <EyeIcon className='size-3 text-muted-foreground' />
                <span className='text-xs'>View Account</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/sales/accounts/${row.original.id}/edit`}>
              <EditAction />
              </Link>
            </DropdownMenuItem>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];
  return (
    <>
      <AccountsFilters />
      <div>
        <div className='mb-4 flex items-center gap-4 text-xs flex-wrap text-muted-foreground'>
          <SpendTierLegendItem tier={AccountTier.high} />
          <SpendTierLegendItem tier={AccountTier.medium} />
          <SpendTierLegendItem tier={AccountTier.low} />
        </div>
        <DataTable columns={columns} data={accounts} denseCell />
      </div>
    </>
  );
}

function SpendTierLegendItem({ tier }: { tier: AccountTier }) {
  return (
    <span className='flex items-center gap-1.5'>
      <SpendTierDot tier={tier} />
      {tier === AccountTier.high
        ? 'High spend (≥ 1M)'
        : tier === AccountTier.medium
          ? 'Medium spend (100K-1M)'
          : 'Low spend (< 100K)'}
    </span>
  );
}

function SpendTierDot({ tier }: { tier: AccountTier }) {
  return (
    <span
      className={cn(
        'inline-block size-[0.4rem] rounded-full mr-1.5 align-middle',
        tier === AccountTier.high && 'bg-emerald-500',
        tier === AccountTier.medium && 'bg-yellow-500',
        tier === AccountTier.low && 'bg-rose-500',
      )}
    />
  );
}

function AccountsFilters() {
  const { filters, onHandleSearch, onTierChange, onLastPurchaseChange } =
    useAccountsFilters();
  return (
    <div className='grid gap-6 md:grid-cols-3'>
      <Search
        placeholder='Search account....'
        defaultValue={filters.search}
        onHandleSearch={onHandleSearch}
      />
      <MiniSelect
        options={[
          { value: 'all', label: 'All Spending Tiers' },
          ...ACCOUNT_TIERS,
        ]}
        value={filters.tier}
        onChange={(val) => onTierChange(val as AccountTier)}
        withForm={false}
        className='bg-background'
      />
      <MiniSelect
        options={[
          { value: 'all', label: 'Any Last Purchase' },
          ...LAST_PURCHASE,
        ]}
        value={filters.lastPurchase ?? 'all'}
        onChange={onLastPurchaseChange}
        className='bg-background'
        withForm={false}
      />
    </div>
  );
}
