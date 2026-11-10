// components/YearSelector.tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays } from 'lucide-react';

interface YearSelectorProps {
  availableYears: number[];
  currentYear: number;
  basePath?: string;
  additionalParams?: Record<string, string>;
  className?: string;
  queryParamName?: string; // New prop: name of the query parameter to set
}

export function YearSelector({
  availableYears,
  currentYear,
  basePath,
  additionalParams = {},
  className = "mb-4 flex justify-center",
  queryParamName = "year", // Default to 'year'
}: YearSelectorProps) {
  const router = useRouter();
  const currentPathname = usePathname();
  const searchParams = useSearchParams();

  const handleYearChange = (yearValue: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // Use the custom query parameter name
    params.set(queryParamName, yearValue);

    // Remove the other default year param if this selector is for attr_year
    // and the other exists, to avoid confusion if both are present.
    // This is optional and depends on your exact URL strategy.
    if (queryParamName === "attr_year" && params.has("year")) {
        // params.delete("year"); // Or keep it if it serves another purpose
    } else if (queryParamName === "year" && params.has("attr_year")) {
        // params.delete("attr_year");
    }


    for (const key in additionalParams) {
      if (key !== queryParamName) {
        params.set(key, additionalParams[key]);
      }
    }
    
    const targetPath = basePath || currentPathname;
    router.push(`${targetPath}?${params.toString()}`);
  };

  if (!availableYears || availableYears.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Select onValueChange={handleYearChange} defaultValue={currentYear?.toString()}>
        <SelectTrigger className="w-auto min-w-[150px] h-9 bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600">
          <CalendarDays className="mr-2 h-4 w-4 opacity-80 text-slate-100" />
          <SelectValue placeholder="Select Year" />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map(year => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}