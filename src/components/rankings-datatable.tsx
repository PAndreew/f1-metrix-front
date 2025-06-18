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
import { ArrowUpDown, ChevronDown, CalendarDays } from "lucide-react" // Added CalendarDays for Year icon

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem, // For year selection
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup, // For radio button style selection
  DropdownMenuRadioItem,  // For radio button style selection
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter, useSearchParams } from 'next/navigation' // For year change navigation


export interface RankingData {
  id: string | number;
  rank: number | null;
  driverName: string;
  score: number | null;
  driverId?: number | string;
  year?: number;
  [key: string]: any;
}

interface RankingsDataTableProps<TData extends RankingData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  // Year Selector specific props (optional)
  isYearlyTable?: boolean;
  availableYears?: number[];
  currentSelectedYear?: number;
  // ---
  tableControls?: React.ReactNode; // Keep for other general controls if needed
  scrollAreaClass?: string;
  initialPageSize?: number;
}

export function RankingsDataTable<TData extends RankingData>({
  columns,
  data,
  isYearlyTable = false,
  availableYears = [],
  currentSelectedYear,
  tableControls,
  scrollAreaClass = "h-[350px]",
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

  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (yearValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', yearValue);
    router.push(`/rankings?${params.toString()}`); // Assuming this table is on /rankings page
  };


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
      <div className="flex items-center py-3 px-1 flex-wrap gap-2 border-b border-slate-700">
        {/* Render other general tableControls if provided */}
        {tableControls && <div className="flex-grow md:flex-grow-0">{tableControls}</div>}

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

        {/* Year Selector Dropdown OR Column Visibility Dropdown */}
        <div className="ml-auto"> {/* Pushes to the right */}
          {isYearlyTable && availableYears.length > 0 && currentSelectedYear !== undefined ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  Year: {currentSelectedYear} <CalendarDays className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select Year</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={currentSelectedYear.toString()} onValueChange={handleYearChange}>
                  {availableYears.map((year) => (
                    <DropdownMenuRadioItem key={year} value={year.toString()}>
                      {year}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : table.getAllColumns().some(col => col.getCanHide()) ? ( // Fallback to Column Visibility if not yearly table
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id === 'driverName' ? 'Driver' : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <ScrollArea className={`${scrollAreaClass} flex-grow`}>
        <Table>
          <TableHeader className="sticky top-0 bg-slate-800 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-700">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-slate-300 h-10 px-3 py-2 text-xs sm:text-sm">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex items-center justify-between space-x-2 py-3 px-1 border-t border-slate-700 flex-shrink-0">
        <div className="text-muted-foreground flex-1 text-xs sm:text-sm">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}