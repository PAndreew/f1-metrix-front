// components/rankingsColumns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { RankingData } from "./rankings-datatable" // Your generic data type
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ExternalLink } from "lucide-react"
import Link from "next/link"

// --- Columns for Yearly Rankings ---
export const yearlyRankingsColumns: ColumnDef<RankingData>[] = [
  {
    accessorKey: "rank",
    header: ({ column }) => (
      <Button variant="ghost" className="p-0 hover:bg-slate-700" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Rank <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("rank") ? parseInt(row.getValue("rank")).toFixed(0) : '-'}</div>,
    size: 60,
  },
  {
    accessorKey: "driverName",
    header: ({ column }) => (
       <Button variant="ghost" className="p-0 hover:bg-slate-700" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Driver <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const driverId = row.original.driverId;
      const year = row.original.year;
      return driverId ? (
        <Link href={`/drivers/${driverId}?year=${year}`} className="hover:underline">
            {row.getValue("driverName")}
        </Link>
      ) : (
        row.getValue("driverName")
      )
    },
  },
  {
    accessorKey: "score",
    header: ({ column }) => (
      <Button variant="ghost" className="p-0 hover:bg-slate-700 text-right w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Score <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-right font-mono">{row.getValue("score") ? (row.getValue("score") as number).toFixed(3) : '-'}</div>,
    size: 100,
  },
  // Optional: Actions column if you want to link to a detailed view or other actions
  // {
  //   id: "actions",
  //   cell: ({ row }) => (
  //     <Button variant="ghost" size="sm" asChild>
  //       <Link href={`/rankings?year=${row.original.year}&driverId=${row.original.driverId}`}>
  //         Details <ExternalLink className="ml-2 h-3 w-3" />
  //       </Link>
  //     </Button>
  //   ),
  //   size: 80,
  // }
];

// --- Columns for All-Time Rankings ---
export const allTimeRankingsColumns: ColumnDef<RankingData>[] = [
 {
    accessorKey: "rank", // This will be the index + 1, set during data mapping
    header: ({ column }) => (
      <Button variant="ghost" className="p-0 hover:bg-slate-700" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Rank <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("rank")}</div>,
    size: 60,
  },
  {
    accessorKey: "driverName",
    header: ({ column }) => (
       <Button variant="ghost" className="p-0 hover:bg-slate-700" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Driver <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const driverId = row.original.driverId;
      return driverId ? (
        <Link href={`/drivers/${driverId}`} className="hover:underline">
            {row.getValue("driverName")}
        </Link>
      ) : (
        row.getValue("driverName")
      )
    },
  },
  {
    accessorKey: "score", // This will be u0_skill_intercept
    header: ({ column }) => (
      <Button variant="ghost" className="p-0 hover:bg-slate-700 text-right w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        u0 Score <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-right font-mono">{row.getValue("score") ? (row.getValue("score") as number).toFixed(3) : '-'}</div>,
    size: 100,
  },
];