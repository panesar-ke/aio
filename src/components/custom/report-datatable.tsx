'use no memo';
import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type {
  ColumnDef,
  Table as ReactTable,
  SortingState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExcelIcon, PdfIcon } from '@/components/custom/icons';
import { reportCaseFormatter } from '@/lib/helpers/formatters';
import { useExportExcel } from '@/hooks/use-export-excel';

interface DataTableProps<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>;
  data: Array<TData>;
  reportTitle: string;
  exportExcelButton?: boolean;
  exportPdfButton?: boolean;
  orientation?: 'portrait' | 'landscape';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  excelData?: Array<any>;
  customFooter?: React.ReactNode;
  defaultPageSize?: number;
}

export function ReportDataTable<TData, TValue>({
  columns,
  data,
  reportTitle,
  exportExcelButton = true,
  exportPdfButton = true,
  orientation = 'portrait',
  excelData,
  customFooter,
  defaultPageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const reportName = `${reportTitle
    .toLowerCase()
    .replaceAll(' ', '-')}-${format(new Date(), 'ddMMyyyyhhmmss')}`;

  const exportToExcel = useExportExcel(reportName);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
    state: {
      sorting,
    },
  });

  const handleExportRowsExcel = () => {
    const rowData =
      excelData ||
      table.getPrePaginationRowModel().rows.map(row => row.original);
    exportToExcel(rowData);
  };

  const handleExportRowsPdf = () => {
    const doc = new jsPDF(orientation, 'pt', 'a4');
    const tableData = table
      .getPrePaginationRowModel()
      .rows.map(row =>
        Object.values(row.original as Record<string, unknown>).map(value =>
          value == null ? '' : String(value)
        )
      );
    const tableHeaders = table
      .getAllColumns()
      .map(col => reportCaseFormatter(col.id));

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
    });

    doc.save(reportName);
  };

  return (
    <div className="space-y-4 bg-card rounded-md border overflow-x-auto p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        {/* <div className="space-y-2">
          <h2 className="text-lg font-semibold">{reportTitle}</h2>
          <p className="text-sm text-muted-foreground">{reportDescription}</p>
        </div> */}
        {exportExcelButton && exportPdfButton && (
          <div className="space-x-2">
            {exportExcelButton && (
              <Button variant="excelExport" onClick={handleExportRowsExcel}>
                <ExcelIcon />
                <span>Export Excel</span>
              </Button>
            )}
            {exportPdfButton && (
              <Button variant="pdfExport" onClick={handleExportRowsPdf}>
                <PdfIcon />
                <span>Export PDF</span>
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader className="bg-secondary">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id} className="h-12 px-4">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="p-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
          {customFooter && (
            <TableFooter>
              <TableRow>{customFooter}</TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

interface DataTablePaginationProps<TData> {
  table: ReactTable<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={value => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map(pageSize => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
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
