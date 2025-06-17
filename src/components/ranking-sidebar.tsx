// components/RankingSidebar.tsx
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DriverYearlyPerformanceRankings } from '@prisma/client';

interface RankingSidebarProps {
  // We'll fetch more rankings and let the CSS handle overflow/scrolling
  // Or, if you want to limit, do it in the parent component before passing
  rankings: DriverYearlyPerformanceRankings[];
  year: number;
}

export function RankingSidebar({ rankings, year }: RankingSidebarProps) {
  return (
    // Card itself needs to be a flex column and take full height of its container
    <Card className='bg-slate-800 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col group'>
      <CardHeader className="flex-shrink-0"> {/* Prevent header from shrinking */}
        <CardTitle className='text-white font-highlight'>YTD Ranking ({year})</CardTitle>
      </CardHeader>

      {/* CardContent will grow and allow internal scrolling if content overflows */}
      <CardContent className="flex-grow overflow-y-auto py-4 px-2 custom-scrollbar"> {/* Added padding directly, custom-scrollbar for aesthetics */}
        {rankings.length > 0 ? (
          <ul className="space-y-2">
            {rankings.map((driver) => (
              <li key={driver.id}> {/* Removed padding from li, Link will handle it */}
                <Link
                  href={`/rankings?year=${year}&driverId=${driver.driverid}`}
                  className="flex justify-between items-center p-2 border border-slate-700 bg-slate-900 text-white rounded-md hover:bg-slate-700 transition-colors"
                >
                  <span className="truncate"> {/* Handle long names */}
                    {driver.yearly_rank?.toFixed(0)}. {driver.forename} {driver.surname}
                  </span>
                  <span className="text-sm text-slate-300 ml-2 whitespace-nowrap"> {/* Adjusted color and prevent wrapping */}
                    {driver.yearly_performance_score?.toFixed(3)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 text-center py-4">No rankings available for {year}.</p>
        )}
      </CardContent>

      {/* CardFooter will always be at the bottom because CardContent grows */}
      <CardFooter className="mt-auto flex-shrink-0 border-t border-slate-700 pt-4"> {/* Added border-t, ensure it doesn't shrink */}
        <Button asChild variant="default" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold">
          <Link href={`/rankings?year=${year}`}>View Full Rankings</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}