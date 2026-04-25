'use client';

import type { ColumnDef } from '@tanstack/react-table';

import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import Link from 'next/link';
// import { parseAsIsoDateTime, parseAsIsoDate, parseAsString } from 'nuqs/server';
import { parseAsString } from 'nuqs';
import { useRouter } from 'next/navigation';

import type { ExpensesSearchParamsSchema } from '@/features/it/utils/expenses/schemas';

import { PermissionGate } from '@/components/auth/client-permission-gate';
import { DeleteAction, EditAction } from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { DataTable } from '@/components/custom/datatable';
import { DatePicker } from '@/components/custom/date-range';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import Search from '@/components/custom/search';
import { ActionButton } from '@/components/ui/action-button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty';
import { dateFormat, numberFormat } from '@/lib/helpers/formatters';

import { useExpenseFilters } from '../../hooks/expenses/use-filters';
import { deleteExpense } from '../../services/expenses/actions';

export const expensesParsers = {
  search: parseAsString.withDefault(''),
  from: parseAsString,
  to: parseAsString,
};

type Expense = {
  id: string;
  expenseDate: string;
  title: string;
  referenceNo: string;
  vendor: string;
  amount: string;
  category: string;
  subCategory: string;
};

async function fetchExpenses(
  params?: ExpensesSearchParamsSchema,
): Promise<Array<Expense>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.from) searchParams.append('from', params.from);
  if (params?.to) searchParams.append('to', params.to);
  const response = await fetch(`/api/it/expenses?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

export const expenseQueries = (params?: ExpensesSearchParamsSchema) =>
  queryOptions({
    queryKey: ['it-expenses', params],
    queryFn: () => fetchExpenses(params),
  });

export function ExpensePage() {
  const { filters, onHandleSearch, onDateChange, onReset } =
    useExpenseFilters();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Search
          onHandleSearch={onHandleSearch}
          defaultValue={filters.search}
          placeholder="Search by vendor or reference number..."
        />
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
      <ErrorBoundaryWithSuspense errorMessage="Failed to fetch expenses. Please try again.">
        <ExpenseTable />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

function ExpenseTable() {
  const { filters, onReset } = useExpenseFilters();
  const { data } = useSuspenseQuery(expenseQueries(filters));
  const queryClient = useQueryClient();
  const router = useRouter();
  const hasFilters =
    Boolean(filters.search?.trim()) ||
    Boolean(filters.from) ||
    Boolean(filters.to);
  const columns: Array<ColumnDef<(typeof data)[0]>> = [
    {
      accessorKey: 'expenseDate',
      header: 'Date',
      cell: ({ row }) => dateFormat(row.original.expenseDate, 'long'),
    },
    {
      accessorKey: 'referenceNo',
      header: 'Reference No.',
      cell: ({ row }) => row.original.referenceNo.toUpperCase(),
    },
    {
      accessorKey: 'vendor',
      header: 'Vendor',
      cell: ({ row }) => row.original.vendor.toUpperCase(),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => numberFormat(row.original.amount),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge className="capitalize" variant="secondary">
          {row.original.category}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem asChild>
              <Link
                href={`/it/expenses-budgeting/expenses/${row.original.id}/edit`}
              >
                <EditAction />
              </Link>
            </DropdownMenuItem>
            <PermissionGate permissions={['it:admin']} match="all">
              <ActionButton
                variant="ghost"
                className="px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0"
                action={deleteExpense.bind(null, row.original.id)}
                requireAreYouSure={true}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['it-expenses'] });
                }}
              >
                <DeleteAction />
              </ActionButton>
            </PermissionGate>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];

  if (data.length === 0) {
    return (
      <EmptyState
        title={
          !hasFilters
            ? 'No expenses yet for current year'
            : 'No expenses found matching your criteria'
        }
        description={
          !hasFilters
            ? 'Get started by creating your first expense.'
            : 'Try adjusting your filters to find expenses.'
        }
        variant={!hasFilters ? 'default' : 'search'}
        action={{
          label: hasFilters ? 'Clear filters' : 'Create Expense',
          variant: hasFilters ? 'outline' : 'default',
          onClick: () => {
            if (hasFilters) {
              onReset();
              return;
            }

            router.push('/it/expenses-budgeting/expenses/new');
          },
        }}
      />
    );
  }
  return <DataTable columns={columns} data={data} />;
}
