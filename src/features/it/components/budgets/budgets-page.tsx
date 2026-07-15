'use client';

import type { ColumnDef } from '@tanstack/react-table';

import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { DownloadIcon, UploadIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { PermissionGate } from '@/components/auth/client-permission-gate';
import { DeleteAction, EditAction } from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import CustomModal from '@/components/custom/custom-modal';
import { DataTable } from '@/components/custom/datatable';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { MiniSelect } from '@/components/custom/mini-select';
import Search from '@/components/custom/search';
import { ActionButton } from '@/components/ui/action-button';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty';
import { useModal } from '@/features/integrations/modal-provider';
import { ImportBudgetsForm } from '@/features/it/components/budgets/import-budgets-form';
import { deleteBudget } from '@/features/it/services/budgets/actions';
import { numberFormat } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';
import { type Option } from '@/types/index.types';

import { useBudgetFilters } from '../../hooks/budgets/use-filters';

type Budget = {
  id: string;
  financialYearStart: number;
  subCategoryId: string;
  category: string;
  subCategory: string;
  totalBudgeted: number;
  totalActual: number;
  variance: number;
};

type BudgetQueryParams = {
  search?: string;
  financialYearStart?: string;
};

async function fetchBudgets(params?: BudgetQueryParams): Promise<Array<Budget>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.financialYearStart) {
    searchParams.append('financialYearStart', params.financialYearStart);
  }
  const response = await fetch(`/api/it/budgets?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

export const budgetQueries = (params?: BudgetQueryParams) =>
  queryOptions({
    queryKey: ['it-budgets', params],
    queryFn: () => fetchBudgets(params),
  });

export function BudgetsPage({
  financialYearOptions,
}: {
  financialYearOptions: Array<Option>;
}) {
  const { filters, onHandleSearch, onFinancialYearChange, onReset } =
    useBudgetFilters();
  const { setOpen } = useModal();

  function handleImport() {
    setOpen(
      <CustomModal
        title="Import Budgets"
        subtitle="Upload a completed budget template to bulk create or update budgets."
        className="max-w-lg!"
      >
        <ImportBudgetsForm
          financialYearOptions={financialYearOptions}
          defaultFinancialYearStart={filters.financialYearStart}
        />
      </CustomModal>,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Search
            onHandleSearch={onHandleSearch}
            defaultValue={filters.search}
            placeholder="Search by category or sub-category..."
            key={filters.search}
          />
          <MiniSelect
            options={financialYearOptions}
            defaultValue={filters.financialYearStart}
            key={filters.financialYearStart}
            withForm={false}
            onChange={onFinancialYearChange}
            className="bg-background sm:w-56"
            placeholder="Financial Year"
          />
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/it/budgets/template?financialYearStart=${filters.financialYearStart}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <DownloadIcon />
            <span>Download Template</span>
          </a>
          <PermissionGate permissions={['it:admin']}>
            <Button variant="outline" onClick={handleImport}>
              <UploadIcon />
              <span>Import</span>
            </Button>
          </PermissionGate>
        </div>
      </div>
      <ErrorBoundaryWithSuspense errorMessage="Failed to fetch budgets. Please try again.">
        <BudgetTable onReset={onReset} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

function BudgetTable({ onReset }: { onReset: () => void }) {
  const { filters } = useBudgetFilters();
  const { data } = useSuspenseQuery(budgetQueries(filters));
  const queryClient = useQueryClient();
  const router = useRouter();
  const hasFilters = Boolean(filters.search?.trim());

  const columns: Array<ColumnDef<Budget>> = [
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category.toUpperCase(),
    },
    {
      accessorKey: 'subCategory',
      header: 'Sub Category',
      cell: ({ row }) => (
        <Link
          href={`/it/expenses-budgeting/budgets/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.subCategory.toUpperCase()}
        </Link>
      ),
    },
    {
      accessorKey: 'totalBudgeted',
      header: 'Total Budgeted',
      cell: ({ row }) => numberFormat(row.original.totalBudgeted),
    },
    {
      accessorKey: 'totalActual',
      header: 'Total Actual',
      cell: ({ row }) => numberFormat(row.original.totalActual),
    },
    {
      accessorKey: 'variance',
      header: 'Variance',
      cell: ({ row }) => (
        <span
          className={cn(
            'font-medium',
            row.original.variance < 0 ? 'text-destructive' : 'text-emerald-600',
          )}
        >
          {numberFormat(row.original.variance)}
        </span>
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
                href={`/it/expenses-budgeting/budgets/${row.original.id}/edit`}
              >
                <EditAction />
              </Link>
            </DropdownMenuItem>
            <PermissionGate permissions={['it:admin']} match="all">
              <ActionButton
                variant="ghost"
                className="px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0"
                action={deleteBudget.bind(null, row.original.id)}
                requireAreYouSure={true}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['it-budgets'] });
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
            ? 'No budgets created yet for this financial year'
            : 'No budgets found matching your criteria'
        }
        description={
          !hasFilters
            ? 'Get started by creating your first budget.'
            : 'Try adjusting your filters to find budgets.'
        }
        variant={!hasFilters ? 'default' : 'search'}
        action={{
          label: hasFilters ? 'Clear filters' : 'Create Budget',
          variant: hasFilters ? 'outline' : 'default',
          onClick: () => {
            if (hasFilters) {
              onReset();
              return;
            }

            router.push('/it/expenses-budgeting/budgets/new');
          },
        }}
      />
    );
  }

  return <DataTable columns={columns} data={data} />;
}
