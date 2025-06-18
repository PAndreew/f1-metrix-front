// components/RankingsDataTable.tsx
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area" // For making the table body scrollable
import Link from "next/link"

// Generic type for data passed to the table
export interface RankingData {
  id: string | number; // Unique identifier for the row
  rank: number | null;
  driverName: string;
  score: number | null;
  driverId?: number | string; // Optional driverId for linking
  year?: number; // Optional year context for linking
  // Add any other common fields or allow dynamic access
  [key: string]: any;
}

interface RankingsDataTableProps<TData extends RankingData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  // Optional controls to render above the table
  tableControls?: React.ReactNode;
  // Optional class for the scrollable area
  scrollAreaClass?: string;
  initialPageSize?: number;
}

export function RankingsDataTable<TData extends RankingData>({
  columns,
  data,
  tableControls,
  scrollAreaClass = "h-[350px]", // Default height for scroll area
  initialPageSize = 10,
}: RankingsDataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  return (
    <div className="w-full h-full flex flex-col">
      {(tableControls || table.getAllColumns().some(col => col.getCanFilter()) || table.getAllColumns().some(col => col.getCanHide())) && (
        <div className="flex items-center py-3 px-1 flex-wrap gap-2 border-b border-slate-700">
          {tableControls && <div className="flex-grow md:flex-grow-0">{tableControls}</div>}

          {/* Example Filter Input - adapt if needed */}
          {table.getColumn("driverName")?.getCanFilter() && (
             <Input
                placeholder="Filter by driver..."
                value={(table.getColumn("driverName")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                table.getColumn("driverName")?.setFilterValue(event.target.value)
                }
                className="max-w-xs h-9 text-sm bg-slate-700 border-slate-600 placeholder:text-slate-400"
            />
          )}

          {table.getAllColumns().some(col => col.getCanHide()) && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto h-9">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                    return (
                        <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                        }
                        >
                        {column.id === 'driverName' ? 'Driver' : column.id}
                        </DropdownMenuCheckboxItem>
                    )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
      <ScrollArea className={`${scrollAreaClass} flex-grow`}>
        <Table>
          <TableHeader className="sticky top-0 bg-slate-800 z-10"> {/* Sticky header */}
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-700">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-slate-300 h-10 px-3 py-2 text-xs sm:text-sm">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
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
                  className="border-slate-700 hover:bg-slate-700/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2 text-xs sm:text-sm">
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
        </Table>
      </ScrollArea>
      <div className="flex items-center justify-between space-x-2 py-3 px-1 border-t border-slate-700 flex-shrink-0">
        <div className="text-muted-foreground flex-1 text-xs sm:text-sm">
          {/* {table.getFilteredSelectedRowModel().rows.length} of{" "} */}
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
          {/* ({table.getFilteredRowModel().rows.length} total rows) */}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}