// components/RankingsDataTable.tsx
"use client"

import *  as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  // getPaginationRowModel, // Not strictly needed if we manage display externally or always show all
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  // PaginationState, // Not needed if no internal pagination controls
} from "@tanstack/react-table"
import { CalendarDays, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
import { useRouter, useSearchParams, usePathname } from 'next/navigation'


export interface RankingData {
  id: string | number;
  rank: number | null;
  driverName: string;
  score: number | null;
  driverId?: number | string;
  year?: number;
  // [key: string]: any;
}

interface RankingsDataTableProps<TData extends RankingData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[]; // For yearly, this is ALL data. For all-time, this is the current BATCH.
  tableType: 'yearly' | 'all-time'; // Simplified

  // --- Props for Yearly Table ---
  availableYears?: number[];
  currentSelectedYear?: number;

  // --- Props for All-Time Table (Batched) ---
  totalAllTimeCount?: number;
  currentBatch?: number; // 1-indexed
  batchSize?: number;

  scrollAreaClass?: string;
}

export function RankingsDataTable<TData extends RankingData>({
  columns,
  data,
  tableType,
  availableYears = [],
  currentSelectedYear,
  totalAllTimeCount = 0,
  currentBatch = 1,
  batchSize = 25,
  scrollAreaClass = "h-[300px]", // Default height for the scrollable part itself
}: RankingsDataTableProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  // No rowSelection state needed if not using checkboxes for selection

  const handleYearChange = (yearValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', yearValue);
    params.delete('batch'); // Reset batch if year changes
    const targetPath = pathname.includes('/all-time') ? '/rankings' : pathname; // Navigate to yearly view
    router.push(`${targetPath}?${params.toString()}`);
  };

  const handleBatchChange = (batchValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('batch', batchValue);
    router.push(`${pathname}?${params.toString()}`);
  };

  const table = useReactTable({
    data, // For yearly, this is all data. For all-time, it's the current batch.
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(), // Only if using table's own pagination
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    // manualPagination: true, // Not needed if we don't use table's pagination controls for all-time
    // pageCount: -1, // Not needed if we don't use table's pagination controls
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      // pagination: undefined, // Explicitly no pagination state for the table itself
    },
    // Prevent table from trying to paginate if all data is passed (for yearly)
    // get paginateRows() can be undefined to disable pagination
  });

  const numBatches = tableType === 'all-time' ? Math.ceil(totalAllTimeCount / batchSize) : 0;
  const batchOptions = Array.from({ length: numBatches }, (_, i) => {
    const start = i * batchSize + 1;
    const end = Math.min((i + 1) * batchSize, totalAllTimeCount);
    return { value: (i + 1).toString(), label: `${start}-${end}` };
  });

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls Bar */}
      <div className="flex items-center justify-between py-3 px-1 flex-wrap gap-2 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
            {table.getColumn("driverName")?.getCanFilter() && (
                <Input
                placeholder="Filter driver..."
                value={(table.getColumn("driverName")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                    table.getColumn("driverName")?.setFilterValue(event.target.value)
                }
                className="max-w-[150px] sm:max-w-xs h-9 text-sm bg-slate-700 border-slate-600 placeholder:text-slate-400"
                />
            )}
        </div>

        <div className="flex items-center gap-2">
          {tableType === 'yearly' && availableYears.length > 0 && currentSelectedYear !== undefined ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 bg-slate-700 text-slate-300 hover:bg-slate-600">
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
          ) : tableType === 'all-time' && numBatches > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 bg-slate-700 text-slate-300 hover:bg-slate-600">
                  Rank Batch: {batchOptions.find(b => b.value === currentBatch.toString())?.label || 'Select'} <Layers className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                <DropdownMenuLabel>Select Rank Batch ({batchSize} per)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={currentBatch.toString()} onValueChange={handleBatchChange}>
                  {batchOptions.map((batch) => (
                    <DropdownMenuRadioItem key={batch.value} value={batch.value}>
                      {batch.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {/* {table.getAllColumns().some(col => col.getCanHide()) && (
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
                        {column.id === 'driverName' ? 'Driver' : column.id.replace(/([A-Z])/g, ' $1').trim()}
                    </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            )} */}
        </div>
      </div>

      <ScrollArea className={`${scrollAreaClass} flex-grow`}>
        <Table>
          <TableHeader className="sticky top-0 bg-slate-800 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-700">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-slate-300 h-10 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-slate-700 hover:bg-slate-700/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2 text-xs sm:text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Footer Info - No Pagination Buttons */}
      <div className="flex items-center justify-between space-x-2 py-3 px-1 border-t border-slate-700 flex-shrink-0">
        <div className="text-muted-foreground flex-1 text-xs sm:text-sm">
          {tableType === 'yearly' && data.length > 0 && (
            <>Displaying all {table.getFilteredRowModel().rows.length} drivers for {currentSelectedYear}</>
          )}
          {tableType === 'all-time' && data.length > 0 && (
            <>
              Showing drivers { (currentBatch -1) * batchSize + 1 }-
              {Math.min(currentBatch * batchSize, totalAllTimeCount)} of{" "}
              {totalAllTimeCount}
            </>
          )}
           {(data.length === 0) && (
            <>No drivers to display.</>
          )}
        </div>
        {/* Intentionally no Previous/Next buttons */}
      </div>
    </div>
  )
}