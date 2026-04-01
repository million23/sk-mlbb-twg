"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { TablePageNavigation } from "@/components/ui/table-page-navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ColumnDefMeta = {
  className?: string;
  thClassName?: string;
  tdClassName?: string;
};

function columnThClassName(columnDef: ColumnDef<unknown, unknown>): string {
  const m = columnDef.meta as ColumnDefMeta | undefined;
  return cn(m?.className, m?.thClassName);
}

function columnTdClassName(columnDef: ColumnDef<unknown, unknown>): string {
  const m = columnDef.meta as ColumnDefMeta | undefined;
  return cn(m?.className, m?.tdClassName);
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Initial column sort (e.g. `[{ id: "created", desc: true }]`). */
  initialSorting?: SortingState;
  filterColumn?: string;
  filterPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  /** When false, all rows render and footer pagination is hidden (e.g. infinite scroll). */
  showPagination?: boolean;
  emptyMessage?: string;
  meta?: Record<string, unknown>;
  getSubRows?: (row: TData) => TData[] | undefined;
  renderExpandedRow?: (row: TData) => React.ReactNode;
  /** Passed to `<table>` (e.g. `border-collapse`). */
  tableClassName?: string;
  /** Passed to each body `<tr>` (e.g. `group` for row hover). */
  tableRowClassName?: string;
  /**
   * Outer wrapper around the table. Defaults to `overflow-hidden`; use
   * `overflow-x-auto` for wide tables that scroll horizontally.
   */
  tableWrapperClassName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filterPlaceholder = "Filter...",
  searchValue = "",
  onSearchChange,
  pageSize = 20,
  pageSizeOptions = [20, 40, 60, 80, 100],
  showPagination = true,
  emptyMessage = "No results.",
  meta,
  getSubRows,
  renderExpandedRow,
  tableClassName,
  tableRowClassName,
  tableWrapperClassName,
  initialSorting = [],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    meta,
    getSubRows,
    getCoreRowModel: getCoreRowModel(),
    ...(showPagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(getSubRows && { getExpandedRowModel: getExpandedRowModel() }),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: showPagination
      ? {
          pagination: {
            pageSize,
          },
        }
      : {},
  });

  const filterCol = filterColumn ? table.getColumn(filterColumn) : null;
  const filterVal =
    filterCol?.getFilterValue() ?? (onSearchChange ? searchValue : "");
  const setFilterVal = (v: string) => {
    if (onSearchChange) {
      onSearchChange(v);
    }
    filterCol?.setFilterValue(v);
  };

  return (
    <div className="space-y-4">
      {(filterColumn || onSearchChange) && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={filterPlaceholder}
            value={filterVal}
            onChange={(e) => setFilterVal(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      <div
        className={cn(
          "rounded-md border",
          tableWrapperClassName ?? "overflow-hidden",
        )}
      >
        <Table className={tableClassName}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={columnThClassName(header.column.columnDef)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const original = row.original as Record<string, unknown>;
                if (original?._expandedContent && renderExpandedRow) {
                  return (
                    <TableRow key={row.id}>
                      <TableCell
                        colSpan={columns.length}
                        className="bg-muted/30 p-0"
                      >
                        {renderExpandedRow(row.original)}
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
                  <TableRow
                    key={row.id}
                    className={tableRowClassName}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={columnTdClassName(cell.column.columnDef)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && data.length > pageSize && (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}

interface DataTablePaginationProps<TData> {
  table: ReturnType<typeof useReactTable<TData>>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [20, 40, 60, 80, 100],
}: DataTablePaginationProps<TData>) {
  const pageCount = Math.max(1, table.getPageCount());
  const page = table.getState().pagination.pageIndex + 1;

  return (
    <div className="flex flex-col gap-4 px-2 pt-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </>
          )}
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <span className="text-sm font-medium text-muted-foreground">
            Rows per page
          </span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue
                placeholder={table.getState().pagination.pageSize}
              >
                {(value) =>
                  value != null && value !== ""
                    ? String(value)
                    : String(table.getState().pagination.pageSize)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <TablePageNavigation
        page={page}
        pageCount={pageCount}
        onPageChange={(p) => table.setPageIndex(p - 1)}
      />
    </div>
  );
}
