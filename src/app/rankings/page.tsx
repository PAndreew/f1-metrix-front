// app/rankings/page.tsx
import prisma from "@/lib/prisma";
import { YearSelector } from "@/components/year-selector";
import { DashboardPanel } from "@/components/dashboard-panel";
import { DriverCard } from "@/components/driver-card"; // Assuming this is your detailed card
import { TopDriverPerYearChart, TopDriverDataPoint } from "@/components/top-driver-per-year";
import { DriverYearlyPerformanceRankings, DriverAllTimeRankingU0 } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getYearlyRankings(year: number, take?: number): Promise<DriverYearlyPerformanceRankings[]> {
  return prisma.driverYearlyPerformanceRankings.findMany({
    where: { year: year },
    orderBy: { yearly_rank: 'asc' },
    take: take, // For showing a limited number initially
  });
}

async function getAllTimeRankings(take?: number): Promise<DriverAllTimeRankingU0[]> {
  // Assuming 'driver_all_time_ranking_u0' is already sorted by u0_skill_intercept
  return prisma.driverAllTimeRankingU0.findMany({
    orderBy: { u0_skill_intercept: 'desc' }, // Explicitly order if not guaranteed by table
    take: take,
  });
}

async function getTopDriverPerYearData(): Promise<TopDriverDataPoint[]> {
  const topDrivers = await prisma.driverYearlyPerformanceRankings.findMany({
    where: { yearly_rank: 1 }, // Assuming rank 1 is the top
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
    driverName: `${d.forename} ${d.surname}`,
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

const DEFAULT_ITEMS_SHOWN = 5; // Number of items to show in lists before expansion/link to full

export default async function RankingsDashboardPage({ searchParams }: { searchParams?: { year?: string } }) {
  const availableYears = await getAvailableYears();
  const currentSelectedYear = searchParams?.year ? parseInt(searchParams.year) : (availableYears[0] || new Date().getFullYear());

  const yearlyRankings = await getYearlyRankings(currentSelectedYear, DEFAULT_ITEMS_SHOWN);
  const allTimeRankings = await getAllTimeRankings(DEFAULT_ITEMS_SHOWN);
  const topDriverHistory = await getTopDriverPerYearData();

  return (
    // Note: Header and Footer are now in RootLayout
    <main className="flex-grow container mx-auto px-2 sm:px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center font-orbitron">
        F1 Driver Rankings Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Panel 1: Year to Date Rankings */}
        <DashboardPanel title={`${currentSelectedYear} Rankings`} initialHeight="h-[500px]">
          <YearSelector availableYears={availableYears} currentYear={currentSelectedYear} />
          <div className="mt-4 space-y-3 overflow-y-auto pr-1"> {/* Added pr for scrollbar space */}
            {yearlyRankings.length > 0 ? (
              yearlyRankings.map((driver, index) => (
                // Using a simpler list item here for brevity in the panel
                // The DriverCard might be too large for a small panel view
                <Link href={`/rankings?year=${currentSelectedYear}&driverId=${driver.driverid}#driver-${driver.driverid}`} key={driver.id}
                      className="block p-3 border border-slate-700 rounded-md hover:bg-slate-800 transition-colors">
                   <div className="flex justify-between items-center">
                        <div>
                            <span className="font-semibold">{driver.yearly_rank?.toFixed(0)}. {driver.forename} {driver.surname}</span>
                        </div>
                        <span className="text-sm text-slate-400">{driver.yearly_performance_score?.toFixed(3)}</span>
                   </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-slate-400 py-4">No rankings for {currentSelectedYear}.</p>
            )}
             {yearlyRankings.length >= DEFAULT_ITEMS_SHOWN && (
                <div className="text-center mt-4">
                    <Button asChild variant="outline">
                        <Link href={`/rankings/year/${currentSelectedYear}`}>View All {currentSelectedYear} Rankings</Link>
                    </Button>
                </div>
            )}
          </div>
        </DashboardPanel>

        {/* Panel 2: All Time Ranking */}
        <DashboardPanel title="All-Time Greats (Based on u0)" initialHeight="h-[500px]">
          <div className="space-y-3 overflow-y-auto pr-1">
            {allTimeRankings.length > 0 ? (
              allTimeRankings.map((driver, index) => (
                 <Link href={`/drivers/${driver.driverid}`} key={driver.id} // Assuming you'll have a driver profile page
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
            {allTimeRankings.length >= DEFAULT_ITEMS_SHOWN && (
                <div className="text-center mt-4">
                    <Button asChild variant="outline">
                        <Link href="/rankings/all-time">View Full All-Time List</Link>
                    </Button>
                </div>
            )}
          </div>
        </DashboardPanel>

        {/* Panel 3: Top Driver Per Year Line Chart */}
        <DashboardPanel title="Top Driver Performance Over Time" initialHeight="h-[400px] md:h-[500px]" > {/* md:col-span-2 to make it wider */}
          <div className="h-full w-full p-2"> {/* Ensure chart has space */}
            {topDriverHistory.length > 0 ? (
              <TopDriverPerYearChart data={topDriverHistory} />
            ) : (
              <p className="text-center text-slate-400 py-4">Not enough data for historical top driver chart.</p>
            )}
          </div>
        </DashboardPanel>

        {/* Panel 4: Placeholder */}
        <DashboardPanel title="Future Insights" initialHeight="h-[400px] md:h-[500px]">
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">More analysis coming soon...</p>
          </div>
        </DashboardPanel>
      </div>
    </main>
  );
}