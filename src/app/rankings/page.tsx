// app/rankings/page.tsx
import prisma from "@/lib/prisma";
import { YearSelector } from "@/components/year-selector";
import { DashboardPanel } from "@/components/dashboard-panel";
import { TopDriverPerYearChart, TopDriverDataPoint } from "@/components/top-driver-per-year";
import { DriverYearlyPerformanceRankings, DriverAllTimeRankingU0 } from "@prisma/client";
import { RankingsDataTable, RankingData } from "@/components/rankings-datatable"; // Import data table
import { yearlyRankingsColumns, allTimeRankingsColumns } from "@/components/rankings-columns"; // Import column definitions

// --- Data Fetching Functions (Unchanged) ---
async function getAllRankingsForYear(year: number): Promise<DriverYearlyPerformanceRankings[]> {
  return prisma.driverYearlyPerformanceRankings.findMany({
    where: { year: year },
    orderBy: { yearly_rank: 'asc' },
  });
}

async function getAllTimeRankingsData(): Promise<DriverAllTimeRankingU0[]> {
  return prisma.driverAllTimeRankingU0.findMany({
    orderBy: { u0_skill_intercept: 'desc' },
  });
}

async function getTopDriverPerYearData(): Promise<TopDriverDataPoint[]> {
  const topDrivers = await prisma.driverYearlyPerformanceRankings.findMany({
    where: { yearly_rank: 1 },
    orderBy: { year: 'asc' },
    select: { year: true, forename: true, surname: true, yearly_performance_score: true }
  });
  return topDrivers.map(d => ({
    year: d.year,
    driverName: `${d.forename || ''} ${d.surname || ''}`.trim(),
    score: d.yearly_performance_score
  }));
}

async function getAvailableYears(): Promise<number[]> {
    const yearsData = await prisma.driverYearlyPerformanceRankings.groupBy({
        by: ['year'], orderBy: { year: 'desc' }, _count: { year: true },
    });
    return yearsData.filter(y => y._count.year > 0).map(y => y.year);
}


export default async function RankingsDashboardPage({ searchParams }: { searchParams?: { year?: string } }) {
  const availableYears = await getAvailableYears();
  const currentSelectedYear = searchParams?.year ? parseInt(searchParams.year) : (availableYears[0] || new Date().getFullYear());

  const yearlyRankingsRaw = await getAllRankingsForYear(currentSelectedYear);
  const allTimeRankingsRaw = await getAllTimeRankingsData();
  const topDriverHistory = await getTopDriverPerYearData();

  // --- Map data to the generic RankingData structure ---
  const yearlyTableData: RankingData[] = yearlyRankingsRaw.map(d => ({
    id: d.id.toString(), // Ensure id is string or number as per RankingData
    rank: d.yearly_rank,
    driverName: `${d.forename || ''} ${d.surname || ''}`.trim(),
    score: d.yearly_performance_score,
    driverId: d.driverid, // Pass original driverid for linking
    year: d.year,
  }));

  const allTimeTableData: RankingData[] = allTimeRankingsRaw.map((d, index) => ({
    id: d.id.toString(), // Ensure id is string or number
    rank: index + 1, // All-time rank is based on order
    driverName: `${d.forename || ''} ${d.surname || ''}`.trim(),
    score: d.u0_skill_intercept,
    driverId: d.driverid,
  }));

  const yearSelectorForYearlyPanel = (
    <YearSelector availableYears={availableYears} currentYear={currentSelectedYear} />
  );

  const panelDefaultHeight = "h-[500px] sm:h-[550px]"; // Unified height for panels with tables
  const tableScrollHeight = "h-full"; // Table scroll area should take full height of its container

  return (
    <main className="flex-grow container mx-auto px-2 sm:px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center font-orbitron">
        F1 Driver Rankings Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Panel 1: Yearly Rankings Table */}
        <DashboardPanel
          title={`${currentSelectedYear} Rankings`}
          initialHeight={panelDefaultHeight}
          contentClassName="p-0 flex flex-col" // Panel's content area is a flex column with no padding
          // No headerActions needed here as YearSelector will be part of tableControls
        >
          <RankingsDataTable
            columns={yearlyRankingsColumns}
            data={yearlyTableData}
            tableControls={yearSelectorForYearlyPanel} // Pass YearSelector here
            scrollAreaClass={tableScrollHeight} // Make table scroll fill panel
            initialPageSize={15} // Adjust as needed
          />
        </DashboardPanel>

        {/* Panel 2: All Time Ranking Table */}
        <DashboardPanel
          title="All-Time Greats (Based on u0)"
          initialHeight={panelDefaultHeight}
          contentClassName="p-0 flex flex-col"
        >
          <RankingsDataTable
            columns={allTimeRankingsColumns}
            data={allTimeTableData}
            scrollAreaClass={tableScrollHeight}
            initialPageSize={15}
          />
        </DashboardPanel>

        {/* Panel 3: Top Driver Per Year Line Chart */}
        <DashboardPanel title="Top Driver Performance Over Time" initialHeight="h-[400px] md:h-[500px]" className="lg:col-span-2">
          <div className="h-full w-full p-2">
            {topDriverHistory.length > 0 ? (
              <TopDriverPerYearChart data={topDriverHistory} />
            ) : (
              <p className="text-center text-slate-400 py-4">Not enough data for historical top driver chart.</p>
            )}
          </div>
        </DashboardPanel>
      </div>
    </main>
  );
}