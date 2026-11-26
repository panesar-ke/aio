'use client';

import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaveActions } from '@/features/human-resources/components/leave/leave-actions';
import { LeaveConfirmDialog } from '@/features/human-resources/components/leave/leave-confirm-dialog';
import { LeaveDetailsDialog } from '@/features/human-resources/components/leave/leave-details-dialog';
import { LeaveStaffFilter } from '@/features/human-resources/components/leave/leave-staff-filter';
import { LeaveStatusPill } from '@/features/human-resources/components/leave/leave-status';
import { printLeave } from '@/features/human-resources/components/leave/print-leave';
import {
  getLeaveBalance,
  type LeaveTypeAllocation,
} from '@/features/human-resources/utils/leave/balance';
import {
  filterLeaves,
  formatLeaveDate,
  formatLeaveReason,
  formatLeaveType,
  getPageItems,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUSES,
  type LeaveDecision,
  type LeaveRow,
} from '@/features/human-resources/utils/leave/leave.types';

const ALL = 'all';
const PAGE_SIZES = [10, 25, 50];

const filterParsers = {
  q: parseAsString.withDefault(''),
  staff: parseAsInteger,
  type: parseAsInteger,
  status: parseAsStringLiteral(LEAVE_STATUSES),
  page: parseAsInteger.withDefault(1),
  size: parseAsInteger.withDefault(PAGE_SIZES[0]),
};

type Props = {
  rows: Array<LeaveRow>;
  leaveTypes: Array<{ id: number; name: string } & LeaveTypeAllocation>;
  employees: Array<{ id: number; name: string }>;
  canManage: boolean;
};

export function LeaveDatatable({
  rows,
  leaveTypes,
  employees,
  canManage,
}: Props) {
  const [query, setQuery] = useQueryStates(filterParsers);
  const [viewing, setViewing] = useState<number | null>(null);
  const [deciding, setDeciding] = useState<{
    decision: LeaveDecision;
    leaveNo: number;
  } | null>(null);

  const filtered = useMemo(
    () =>
      filterLeaves(rows, {
        q: query.q,
        employeeId: query.staff,
        leaveTypeId: query.type,
        status: query.status,
      }),
    [rows, query.q, query.staff, query.type, query.status],
  );

  const pageSize = PAGE_SIZES.includes(query.size)
    ? query.size
    : PAGE_SIZES[0];
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Clamped, so deleting the last row of the last page does not strand the user.
  const page = Math.min(Math.max(query.page, 1), pageCount);
  const first = (page - 1) * pageSize;
  const visible = filtered.slice(first, first + pageSize);

  // Looked up by number so the dialogs always show the refreshed record.
  const viewed = rows.find((r) => r.leaveNo === viewing);
  const decided = rows.find((r) => r.leaveNo === deciding?.leaveNo);

  function print(leave: LeaveRow) {
    const type = leaveTypes.find((t) => t.id === leave.leaveTypeId);
    void printLeave(leave, type ? getLeaveBalance(leave, rows, type) : null);
  }

  /** Changing a filter always returns to the first page. */
  function filterBy(values: Parameters<typeof setQuery>[0]) {
    void setQuery({ ...values, page: null });
  }

  const goTo = (target: number) =>
    void setQuery({ page: target === 1 ? null : target });

  return (
    <div>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <div className='bg-card relative w-full sm:w-72'>
          <SearchIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <input
            type='text'
            aria-label='Search leave applications'
            placeholder='Search staff or reason…'
            value={query.q}
            onChange={(e) => filterBy({ q: e.target.value || null })}
            className='border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border bg-transparent pr-10 pl-10 text-sm outline-none focus-visible:ring-[3px]'
          />
          {query.q && (
            <button
              type='button'
              aria-label='Clear search'
              onClick={() => filterBy({ q: null })}
              className='text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-1'
            >
              <XIcon className='size-3.5' />
            </button>
          )}
        </div>

        <LeaveStaffFilter
          employees={employees}
          value={query.staff}
          onChange={(staff) => filterBy({ staff })}
        />
      </div>

      <div className='mb-4 flex flex-wrap items-center gap-3'>
        <Tabs
          value={query.type === null ? ALL : String(query.type)}
          onValueChange={(v) =>
            filterBy({ type: v === ALL ? null : Number(v) })
          }
        >
          <TabsList className='h-auto flex-wrap'>
            <TabsTrigger value={ALL} className='px-3 py-1.5 text-xs'>
              All Types
            </TabsTrigger>
            {leaveTypes.map((t) => (
              <TabsTrigger
                key={t.id}
                value={String(t.id)}
                className='px-3 py-1.5 text-xs'
              >
                {formatLeaveType(t.name)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs
          value={query.status ?? ALL}
          onValueChange={(v) =>
            filterBy({
              status: LEAVE_STATUSES.find((s) => s === v) ?? null,
            })
          }
        >
          <TabsList className='h-auto flex-wrap'>
            <TabsTrigger value={ALL} className='px-3 py-1.5 text-xs'>
              All
            </TabsTrigger>
            {LEAVE_STATUSES.map((s) => (
              <TabsTrigger key={s} value={s} className='px-3 py-1.5 text-xs'>
                {LEAVE_STATUS_LABELS[s]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className='bg-card overflow-hidden rounded-xl border'>
        {visible.length === 0 ? (
          <div className='flex flex-col items-center gap-2 px-4 py-16 text-center'>
            <CalendarIcon className='text-muted-foreground size-8 stroke-[1.25]' />
            <p className='text-sm font-medium'>No leave applications found</p>
            <p className='text-muted-foreground text-xs'>
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <>
            <Table aria-label='Leave applications'>
              <TableHeader className='bg-muted'>
                <TableRow>
                  {[
                    'Staff Name',
                    'Type',
                    'Start Date',
                    'End Date',
                    '# Days',
                    'Reason',
                    'Status',
                  ].map((heading) => (
                    <TableHead
                      key={heading}
                      className={
                        heading === 'Reason'
                          ? 'text-muted-foreground hidden px-4 text-[0.6875rem] font-semibold tracking-wider uppercase lg:table-cell'
                          : 'text-muted-foreground px-4 text-[0.6875rem] font-semibold tracking-wider uppercase'
                      }
                    >
                      {heading}
                    </TableHead>
                  ))}
                  <TableHead className='w-11'>
                    <span className='sr-only'>Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((leave) => (
                  <TableRow
                    key={leave.leaveNo}
                    tabIndex={0}
                    className='cursor-pointer'
                    onClick={() => setViewing(leave.leaveNo)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) {
                        setViewing(leave.leaveNo);
                      }
                    }}
                  >
                    <TableCell className='px-4 py-3 font-medium'>
                      {leave.employeeName}
                    </TableCell>
                    <TableCell className='px-4 py-3'>
                      <span className='bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold'>
                        {formatLeaveType(leave.leaveType)}
                      </span>
                    </TableCell>
                    <TableCell className='px-4 py-3'>
                      {formatLeaveDate(leave.startDate)}
                    </TableCell>
                    <TableCell className='px-4 py-3'>
                      {formatLeaveDate(leave.endDate)}
                    </TableCell>
                    <TableCell className='px-4 py-3 text-center font-semibold tabular-nums'>
                      {leave.daysTaken}
                    </TableCell>
                    <TableCell
                      className='text-muted-foreground hidden max-w-64 truncate px-4 py-3 lg:table-cell'
                      title={formatLeaveReason(leave.reason) || undefined}
                    >
                      {formatLeaveReason(leave.reason) || '—'}
                    </TableCell>
                    <TableCell className='px-4 py-3'>
                      <LeaveStatusPill status={leave.status} />
                    </TableCell>
                    {/* Menu events bubble through the portal to the row. */}
                    <TableCell
                      className='px-3 py-3'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LeaveActions
                        leave={leave}
                        canManage={canManage}
                        onView={() => setViewing(leave.leaveNo)}
                        onPrint={() => print(leave)}
                        onDecide={(decision) =>
                          setDeciding({ decision, leaveNo: leave.leaveNo })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className='flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3'>
              <div className='text-muted-foreground flex items-center gap-3 text-xs'>
                <span>
                  Showing {first + 1}–{first + visible.length} of{' '}
                  {filtered.length}
                </span>
                <span aria-hidden>|</span>
                <div className='flex items-center gap-2'>
                  Rows per page
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => filterBy({ size: Number(v) })}
                  >
                    <SelectTrigger
                      className='h-8! w-18 text-xs'
                      aria-label='Rows per page'
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side='top'>
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <nav aria-label='Pagination' className='flex items-center gap-1'>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  disabled={page === 1}
                  onClick={() => goTo(page - 1)}
                >
                  <ChevronLeftIcon />
                  <span className='sr-only'>Previous page</span>
                </Button>
                {getPageItems(page, pageCount).map((item, i) =>
                  item === null ? (
                    <span
                      key={`gap-${i}`}
                      className='text-muted-foreground px-1 text-xs'
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === page ? 'default' : 'outline'}
                      size='icon'
                      className='size-8 text-xs'
                      aria-current={item === page ? 'page' : undefined}
                      onClick={() => goTo(item)}
                    >
                      {item}
                    </Button>
                  ),
                )}
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  disabled={page === pageCount}
                  onClick={() => goTo(page + 1)}
                >
                  <ChevronRightIcon />
                  <span className='sr-only'>Next page</span>
                </Button>
              </nav>
            </div>
          </>
        )}
      </div>

      {viewed && (
        <LeaveDetailsDialog
          leave={viewed}
          canManage={canManage}
          onClose={() => setViewing(null)}
          onPrint={() => print(viewed)}
          onDecide={(decision) =>
            setDeciding({ decision, leaveNo: viewed.leaveNo })
          }
        />
      )}

      {deciding && decided && (
        <LeaveConfirmDialog
          decision={deciding.decision}
          leave={decided}
          onClose={() => setDeciding(null)}
          onDone={() => {
            setDeciding(null);
            setViewing(null);
          }}
        />
      )}
    </div>
  );
}
