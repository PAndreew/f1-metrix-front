// components/RankingSidebar.tsx
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DriverYearlyPerformanceRankings } from '@prisma/client'; // Assuming you have this type generated

interface RankingSidebarProps {
  rankings: DriverYearlyPerformanceRankings[]; // Pass the top N rankings
  year: number;
}

export function RankingSidebar({ rankings, year }: RankingSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>YTD Ranking ({year})</CardTitle>
      </CardHeader>
      <CardContent>
        {rankings.length > 0 ? (
          <ul className="space-y-2">
            {rankings.map((driver) => (
              <li key={driver.id} className="p-2 border rounded-md hover:bg-accent">
                <Link href={`/rankings?year=${year}&driverId=${driver.driverid}`} className="flex justify-between items-center">
                  <span>{driver.yearly_rank?.toFixed(0)}. {driver.forename} {driver.surname}</span>
                  <span className="text-sm text-muted-foreground">{driver.yearly_performance_score?.toFixed(3)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No rankings available for {year}.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="default" className="w-full">
          <Link href={`/rankings?year=${year}`}>View Full Rankings</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}