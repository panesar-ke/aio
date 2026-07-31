"use no memo";
import type {
  ColumnDef,
  PaginationState,
  Table as ReactTable,
  Row,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>;
  data: Array<TData>;
  denseCell?: boolean;
  withPaginationButtons?: boolean;

  // Manual/server mode — all optional, default to undefined so existing
  // (client-side) callers are unaffected.
  manualPagination?: boolean;
  manualSorting?: boolean;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: (
    updater: PaginationState | ((old: PaginationState) => PaginationState),
  ) => void;
  sorting?: SortingState;
  onSortingChange?: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;

  // Row selection — all optional, opt-in only.
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (
    updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState),
  ) => void;
  getRowId?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  withPaginationButtons = true,
  denseCell = false,
  manualPagination,
  manualSorting,
  pageCount,
  pagination,
  onPaginationChange,
  sorting: controlledSorting,
  onSortingChange,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    [],
  );

  const sorting = manualSorting ? (controlledSorting ?? []) : internalSorting;

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    onSortingChange: manualSorting ? onSortingChange : setInternalSorting,
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
    // Only set pagination-related options when actually in manual mode.
    // react-table merges options as `{ ...defaultOptions, ...options }`, so
    // explicitly passing `onPaginationChange: undefined` here for client-side
    // callers would overwrite the library's internal pagination state
    // updater with a no-op, silently breaking next/previous/page-size
    // navigation for every existing (non-manual) table.
    ...(manualPagination
      ? { manualPagination, pageCount, onPaginationChange }
      : {}),
    ...(getRowId ? { getRowId } : {}),
    enableRowSelection,
    ...(onRowSelectionChange ? { onRowSelectionChange } : {}),
    state: {
      sorting,
      ...(manualPagination && pagination ? { pagination } : {}),
      ...(rowSelection ? { rowSelection } : {}),
    },
  });

  return (
    <>
      <div className="rounded-md border overflow-x-auto bg-card">
        <Table>
          <TableHeader className="">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-12 px-4">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn("p-4", { "px-4 py-2": denseCell })}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {withPaginationButtons && <DataTablePagination table={table} />}
    </>
  );
}

interface DataTablePaginationProps<TData> {
  table: ReactTable<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2 mt-2">
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-17.5">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-25 items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
