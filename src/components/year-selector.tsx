'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface YearSelectorProps {
  availableYears: number[];
  currentYear: number;
}

export function YearSelector({ availableYears, currentYear }: YearSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (yearValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', yearValue);
    router.push(`/rankings?${params.toString()}`);
  };

  return (
    <div className="mb-4 flex justify-center">
      <Select onValueChange={handleYearChange} defaultValue={currentYear.toString()}>
        <SelectTrigger className="w-[180px]">
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