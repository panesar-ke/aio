'use client';
import type { ColumnDef } from '@tanstack/react-table';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { SaleOrder } from '@/features/sales/utils/sales.types';
import type { Option } from '@/types/index.types';

import { PermissionGate } from '@/components/auth/client-permission-gate';
import {
  DeleteAction,
  EditAction,
  ViewDetailsAction,
} from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { DataTable } from '@/components/custom/datatable';
import { DatePicker } from '@/components/custom/date-range';
import { MiniSelect } from '@/components/custom/mini-select';
import Search from '@/components/custom/search';
import { ActionButton } from '@/components/ui/action-button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty';
import { useSalesOrdersFilters } from '@/features/sales/hooks/leads/use-filters';
import { cancelSaleOrder } from '@/features/sales/services/orders/actions';
import {
  formatSaleOrderAmount,
  formatSaleOrderNo,
} from '@/features/sales/utils/sale-order-format';
import {
  canEditDeleteSaleOrder,
  saleOrderStatusLabel,
  saleOrderStatusVariant,
} from '@/features/sales/utils/sale-order-permissions';
import { getFinancialYearRanges } from '@/lib/helpers/dates';
import { dateFormat, titleCase } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

type PageProps = {
  isSalesAdmin: boolean;
  orders: Array<SaleOrder>;
  salesPersons: Array<Option>;
  accounts: Array<Option>;
};

export function ClientSalesOrderPage({
  isSalesAdmin,
  orders,
  salesPersons,
  accounts,
}: PageProps) {
  const { filters, onReset } = useSalesOrdersFilters();

  const hasFilters =
    filters.account ||
    filters.salesPerson ||
    filters.search ||
    filters.from ||
    filters.to;
  const router = useRouter();
  return (
    <>
      <SalesOrdersFilters
        isSalesAdmin={isSalesAdmin}
        salesPersons={salesPersons}
        accounts={accounts}
      />
      {orders.length === 0 ? (
        <EmptyState
          title={
            !hasFilters
              ? 'No orders yet for current year'
              : 'No orders found matching your criteria'
          }
          description={
            !hasFilters
              ? 'Get started by creating your first order.'
              : 'Try adjusting your filters to find orders.'
          }
          variant={!hasFilters ? 'default' : 'search'}
          action={{
            label: hasFilters ? 'Clear filters' : 'Create Sale Order',
            variant: hasFilters ? 'outline' : 'default',
            onClick: () => {
              if (hasFilters) {
                onReset();
                return;
              }

              router.push('/sales/orders/new');
            },
          }}
        />
      ) : (
        <SalesOrdersDatatable orders={orders} />
      )}
    </>
  );
}

function SalesOrdersDatatable({ orders }: { orders: Array<SaleOrder> }) {
  const columns: Array<ColumnDef<SaleOrder>> = [
    {
      accessorKey: 'saleOrderNo',
      header: 'Order No',
      cell: ({ row }) =>
        formatSaleOrderNo(row.original.saleOrderNo, row.original.dateRaised),
    },
    {
      accessorKey: 'dateRaised',
      header: 'Order Date',
      cell: ({ row }) => dateFormat(row.original.dateRaised, 'long'),
    },
    {
      accessorKey: 'company',
      header: 'Account',
      cell: ({ row }) => titleCase(row.original.company),
    },
    {
      accessorKey: 'totalItems',
      header: 'Total Items',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={saleOrderStatusVariant(row.original.status)}>
          {saleOrderStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: 'total',
      header: () => <div className='text-right'>Amount</div>,
      cell: ({ row }) => (
        <div className='text-right font-medium tabular-nums'>
          {formatSaleOrderAmount(row.original.currency, row.original.total)}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row: { original } }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            {canEditDeleteSaleOrder(original.status) && (
              <PermissionGate permissions={['sales:admin']}>
                <DropdownMenuItem asChild>
                  <Link
                    prefetch={false}
                    href={`/sales/orders/${original.id}/edit`}
                  >
                    <EditAction />
                  </Link>
                </DropdownMenuItem>
              </PermissionGate>
            )}
            <DropdownMenuItem asChild>
              <Link
                prefetch={false}
                href={`/sales/orders/${original.id}/details`}
              >
                <ViewDetailsAction text='View Details' />
              </Link>
            </DropdownMenuItem>
            {canEditDeleteSaleOrder(original.status) && (
              <PermissionGate permissions={['sales:admin']}>
                <ActionButton
                  variant='ghost'
                  className='px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0'
                  action={async () => cancelSaleOrder(original.id)}
                  requireAreYouSure={true}
                >
                  <DeleteAction />
                </ActionButton>
              </PermissionGate>
            )}
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={orders} />;
}

function SalesOrdersFilters({
  salesPersons,
  accounts,
  isSalesAdmin,
}: {
  salesPersons: Array<Option>;
  accounts: Array<Option>;
  isSalesAdmin: boolean;
}) {
  const financialYearRanges = getFinancialYearRanges();
  const {
    filters,
    onSalesPersonChange,
    onAccountChange,
    onDateChange,
    onReset,
    onHandleSearch,
  } = useSalesOrdersFilters();

  return (
    <div
      className={cn(
        'grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3',
      )}
    >
      <Search
        placeholder='Search orders...'
        defaultValue={filters.search}
        onHandleSearch={onHandleSearch}
      />
      {isSalesAdmin && (
        <MiniSelect
          withForm={false}
          placeholder='All Sales Persons'
          options={[{ value: '', label: 'All' }, ...salesPersons]}
          className='bg-background'
          value={filters.salesPerson ?? ''}
          onChange={onSalesPersonChange}
        />
      )}
      <MiniSelect
        withForm={false}
        defaultValue=''
        placeholder='All Accounts'
        options={[{ value: '', label: 'All' }, ...accounts]}
        className='bg-background'
        value={filters.account ?? ''}
        onChange={onAccountChange}
      />
      <DatePicker
        onDateChange={(date) => {
          onDateChange({
            from: date.from || new Date(financialYearRanges.currentYear.from),
            to: date.to || new Date(financialYearRanges.currentYear.to),
          });
        }}
        onReset={onReset}
        initialDateRange={{
          from: filters.from
            ? new Date(filters.from)
            : new Date(financialYearRanges.currentYear.from),
          to: filters.to
            ? new Date(filters.to)
            : new Date(financialYearRanges.currentYear.to),
        }}
      />
    </div>
  );
}
