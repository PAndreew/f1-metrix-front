// app/rankings/page.tsx
import prisma from "@/lib/prisma";
// import { YearSelector } from "@/components/YearSelector"; // YearSelector is now part of YearlyRankingsPanel
import { DashboardPanel } from "@/components/dashboard-panel";
// import { DriverCard } from "@/components/DriverCard";
import { TopDriverPerYearChart, TopDriverDataPoint } from "@/components/top-driver-per-year";
import { DriverYearlyPerformanceRankings, DriverAllTimeRankingU0 } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { YearlyRankingsPanel } from "@/components/yearly-ranking-panel"; // Import the new panel

// Fetch ALL rankings for the given year
async function getAllRankingsForYear(year: number): Promise<DriverYearlyPerformanceRankings[]> {
  return prisma.driverYearlyPerformanceRankings.findMany({
    where: { year: year },
    orderBy: { yearly_rank: 'asc' },
  });
}

async function getAllTimeRankings(take?: number): Promise<DriverAllTimeRankingU0[]> {
  return prisma.driverAllTimeRankingU0.findMany({
    orderBy: { u0_skill_intercept: 'desc' },
    take: take,
  });
}

async function getTopDriverPerYearData(): Promise<TopDriverDataPoint[]> {
  const topDrivers = await prisma.driverYearlyPerformanceRankings.findMany({
    where: { yearly_rank: 1 },
    orderBy: { year: 'asc' },
    select: {
      year: true,
      forename: true,
      surname: true,
      yearly_performance_score: true,
    }
  });
  return topDrivers.map(d => ({
    year: d.year,
    driverName: `${d.forename || ''} ${d.surname || ''}`.trim(), // Handle null names
    score: d.yearly_performance_score
  }));
}

async function getAvailableYears(): Promise<number[]> {
    const yearsData = await prisma.driverYearlyPerformanceRankings.groupBy({
        by: ['year'],
        orderBy: { year: 'desc' },
        _count: { year: true },
    });
    return yearsData.filter(y => y._count.year > 0).map(y => y.year);
}

const DEFAULT_ITEMS_SHOWN_IN_PANEL = 10;
const DEFAULT_ITEMS_ALL_TIME = 7;

export default async function RankingsDashboardPage({ searchParams }: { searchParams?: { year?: string } }) {
  const availableYears = await getAvailableYears();
  const currentSelectedYear = searchParams?.year ? parseInt(searchParams.year) : (availableYears[0] || new Date().getFullYear());

  const allRankingsForSelectedYear = await getAllRankingsForYear(currentSelectedYear);
  const allTimeRankings = await getAllTimeRankings();
  const topDriverHistory = await getTopDriverPerYearData();

  return (
    <main className="flex-grow container mx-auto px-2 sm:px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center font-orbitron">
        F1 Driver Rankings Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Panel 1: Yearly Rankings Panel (now uses the dedicated component) */}
        <YearlyRankingsPanel
          allRankingsForYear={allRankingsForSelectedYear}
          availableYears={availableYears}
          currentSelectedYear={currentSelectedYear}
          defaultItemsShown={DEFAULT_ITEMS_SHOWN_IN_PANEL}
        />

        {/* Panel 2: All Time Ranking */}
        <DashboardPanel title="All-Time Greats (Based on u0)" initialHeight="h-[480px] sm:h-[530px]">
          <div className="space-y-3 overflow-y-auto pr-1 h-full p-4"> {/* Added p-4 to match styling, h-full */}
            {allTimeRankings.length > 0 ? (
              allTimeRankings.map((driver, index) => (
                 <Link href={`/drivers/${driver.driverid}`} key={driver.id}
                      className="block p-3 border border-slate-700 rounded-md hover:bg-slate-800 transition-colors">
                   <div className="flex justify-between items-center">
                        <div>
                            <span className="font-semibold">{index + 1}. {driver.forename} {driver.surname}</span>
                        </div>
                        <span className="text-sm text-slate-400">{driver.u0_skill_intercept?.toFixed(3)}</span>
                   </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-slate-400 py-4">No all-time rankings available.</p>
            )}
            {allTimeRankings.length >= DEFAULT_ITEMS_ALL_TIME && ( // Use the constant
                <div className="text-center mt-4 sticky bottom-0 bg-slate-800 py-2"> {/* Made button sticky-ish */}
                    <Button asChild variant="outline">
                        <Link href="/rankings/all-time">View Full All-Time List</Link>
                    </Button>
                </div>
            )}
          </div>
        </DashboardPanel>

        {/* Panel 3: Top Driver Per Year Line Chart (can be wider on larger screens) */}
        <DashboardPanel title="Top Driver Performance Over Time" initialHeight="h-[400px] md:h-[500px]" className="lg:col-span-2">
          <div className="h-full w-full p-2">
            {topDriverHistory.length > 0 ? (
              <TopDriverPerYearChart data={topDriverHistory} />
            ) : (
              <p className="text-center text-slate-400 py-4">Not enough data for historical top driver chart.</p>
            )}
          </div>
        </DashboardPanel>

        {/* Panel 4: Placeholder (can be wider on larger screens) */}
        {/* <DashboardPanel title="Future Insights" initialHeight="h-[400px] md:h-[500px]" className="lg:col-span-1">
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">More analysis coming soon...</p>
          </div>
        </DashboardPanel> */}
      </div>
    </main>
  );
}