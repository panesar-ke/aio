'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { SearchIcon, XIcon } from 'lucide-react';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import { DataTable } from '@/components/custom/datatable';
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeActions } from '@/features/human-resources/components/employees/employee-actions';
import { ExportEmployeesDialog } from '@/features/human-resources/components/employees/export-employees-dialog';
import {
  type EmployeeDisplayStatus,
  type EmployeeRow,
  type EmployeeStats,
  type EmployeeStatusTab,
  isExited,
  STATUS_LABELS,
  STATUS_TABS,
} from '@/features/human-resources/utils/employees/employees.types';
import { dateFormat, getInitials, titleCase } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

const ALL = 'all';

const STATUS_STYLES: Record<EmployeeDisplayStatus, string> = {
  ACTIVE: 'bg-success text-success-foreground',
  ON_LEAVE: 'bg-warning text-warning-foreground',
  TERMINATED: 'bg-muted text-muted-foreground',
  RESIGNED: 'bg-muted text-muted-foreground',
  RETIRED: 'bg-muted text-muted-foreground',
  DECEASED: 'bg-muted text-muted-foreground',
};

const filterParsers = {
  q: parseAsString.withDefault(''),
  dept: parseAsString.withDefault(''),
  type: parseAsString.withDefault(''),
  status: parseAsStringLiteral([
    'ALL',
    'ACTIVE',
    'ON_LEAVE',
    'EXITED',
  ] as const).withDefault('ALL'),
};

function matchesStatus(row: EmployeeRow, tab: EmployeeStatusTab) {
  if (tab === 'ALL') return true;
  if (tab === 'EXITED') return isExited(row.status);
  return row.status === tab;
}

const getColumns = (canDelete: boolean): Array<ColumnDef<EmployeeRow>> => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Employee' />
    ),
    cell: ({ row: { original: e } }) => (
      <div className='flex items-center gap-3'>
        <span
          aria-hidden
          className='bg-secondary text-secondary-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold'
        >
          {getInitials(e.name)}
        </span>
        <div className='min-w-0'>
          <div className='truncate font-medium'>{e.name.toUpperCase()}</div>
          <div className='text-muted-foreground text-xs'>
            {e.payrollNo ? ` Payroll ${e.payrollNo}` : ''}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'department',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Department / Title' />
    ),
    cell: ({ row: { original: e } }) => (
      <div>
        <div className='font-medium'>{e.department}</div>
        <div className='text-muted-foreground text-xs'>{e.designation}</div>
      </div>
    ),
  },
  {
    accessorKey: 'employmentType',
    header: 'Type',
    cell: ({ row: { original: e } }) =>
      e.employmentType ? (
        <Badge variant={e.employmentType === 'CONTRACT' ? 'info' : 'secondary'}>
          {titleCase(e.employmentType)}
        </Badge>
      ) : (
        <span className='text-muted-foreground'>—</span>
      ),
  },
  {
    accessorKey: 'joiningDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date Joined' />
    ),
    cell: ({ row: { original: e } }) =>
      e.joiningDate ? (
        <div>
          <div>{dateFormat(e.joiningDate, 'reporting')}</div>
          <div className='text-muted-foreground text-xs'>{e.tenure}</div>
        </div>
      ) : (
        <span className='text-muted-foreground'>—</span>
      ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row: { original: e } }) => (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold whitespace-nowrap',
          STATUS_STYLES[e.status],
        )}
      >
        <span aria-hidden className='size-1.5 rounded-full bg-current' />
        {STATUS_LABELS[e.status]}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row: { original: e } }) => (
      <EmployeeActions employee={e} canDelete={canDelete} />
    ),
  },
];

type Props = {
  rows: Array<EmployeeRow>;
  stats: EmployeeStats;
  canExportSensitive: boolean;
  canDelete: boolean;
};

export function EmployeesDatatable({
  rows,
  stats,
  canExportSensitive,
  canDelete,
}: Props) {
  const [filters, setFilters] = useQueryStates(filterParsers);
  const columns = useMemo(() => getColumns(canDelete), [canDelete]);

  const departments = useMemo(
    () => [...new Set(rows.map((r) => r.department))].sort(),
    [rows],
  );
  const types = useMemo(
    () =>
      [
        ...new Set(
          rows.flatMap((r) => (r.employmentType ? [r.employmentType] : [])),
        ),
      ].sort(),
    [rows],
  );

  // Everything except status, so tab counts reflect the other active filters.
  const base = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        q &&
        !`${r.name} ${r.id} ${r.payrollNo ?? ''}`.toLowerCase().includes(q)
      )
        return false;
      if (filters.dept && r.department !== filters.dept) return false;
      if (filters.type && r.employmentType !== filters.type) return false;
      return true;
    });
  }, [rows, filters.q, filters.dept, filters.type]);

  const visible = useMemo(
    () => base.filter((r) => matchesStatus(r, filters.status)),
    [base, filters.status],
  );
  const employeeIds = useMemo(() => visible.map((r) => r.id), [visible]);

  const hasFilters = Boolean(
    filters.q || filters.dept || filters.type || filters.status !== 'ALL',
  );

  const statCards = [
    { label: 'Total Employees', value: stats.total, className: '' },
    {
      label: 'Active',
      value: stats.active,
      className: 'text-success-foreground',
    },
    {
      label: 'On Leave Today',
      value: stats.onLeave,
      className: 'text-warning-foreground',
    },
    { label: 'On Contract', value: stats.onContract, className: '' },
  ];

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {statCards.map((card) => (
          <div
            key={card.label}
            className='bg-card rounded-xl border px-4 py-3.5'
          >
            <p className='text-muted-foreground text-[0.6875rem] font-semibold tracking-wider uppercase'>
              {card.label}
            </p>
            <p
              className={cn(
                'mt-1 text-2xl font-bold tabular-nums',
                card.className,
              )}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <div className='bg-card relative min-w-56 flex-1'>
          <SearchIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <input
            type='search'
            aria-label='Search employees'
            placeholder='Search name, employee no. or payroll no…'
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value || null })}
            className='border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border bg-transparent pr-3 pl-10 text-sm outline-none focus-visible:ring-[3px]'
          />
        </div>

        <Select
          value={filters.dept || ALL}
          onValueChange={(v) => setFilters({ dept: v === ALL ? null : v })}
        >
          <SelectTrigger
            className='h-10! w-48'
            aria-label='Filter by department'
          >
            <SelectValue placeholder='All Departments' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.type || ALL}
          onValueChange={(v) => setFilters({ type: v === ALL ? null : v })}
        >
          <SelectTrigger
            className='h-10! w-48'
            aria-label='Filter by employment type'
          >
            <SelectValue placeholder='All Employment Types' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Employment Types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {titleCase(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            type='button'
            variant='ghost'
            size='lg'
            onClick={() =>
              setFilters({ q: null, dept: null, type: null, status: null })
            }
          >
            <XIcon />
            Clear filters
          </Button>
        )}

        <ExportEmployeesDialog
          employeeIds={employeeIds}
          canExportSensitive={canExportSensitive}
        />
      </div>

      <Tabs
        value={filters.status}
        onValueChange={(v) =>
          setFilters({ status: v === 'ALL' ? null : (v as EmployeeStatusTab) })
        }
      >
        <TabsList className='h-auto flex-wrap'>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='gap-1.5 px-3 py-1.5'
            >
              {tab.label}
              <span className='text-muted-foreground text-[0.6875rem] tabular-nums'>
                {base.filter((r) => matchesStatus(r, tab.value)).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable columns={columns} data={visible} />
    </div>
  );
}
