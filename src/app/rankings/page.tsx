// app/rankings/page.tsx
import prisma from "@/lib/prisma";
// YearSelector is now part of RankingsDataTable
import { DashboardPanel } from "@/components/dashboard-panel";
import { TopDriverPerYearChart, TopDriverDataPoint } from "@/components/top-driver-per-year";
import { DriverYearlyPerformanceRankings, DriverAllTimeRankingU0 } from "@prisma/client";
import { RankingsDataTable, RankingData } from "@/components/rankings-datatable";
import { yearlyRankingsColumns, allTimeRankingsColumns } from "@/components/rankings-columns";

const BATCH_SIZE_ALL_TIME = 30; // Define batch size for all-time
const DEFAULT_CLIENT_PAGE_SIZE = 30; // Define page size for yearly

// --- Data Fetching Functions ---
async function getAllRankingsForYear(year: number): Promise<DriverYearlyPerformanceRankings[]> {
  // For yearly, we fetch all and let the table paginate client-side
  return prisma.driverYearlyPerformanceRankings.findMany({
    where: { year: year },
    orderBy: { yearly_rank: 'asc' },
  });
}

// Fetches a specific batch for all-time rankings
async function getAllTimeRankingsBatch(batch: number, batchSize: number): Promise<DriverAllTimeRankingU0[]> {
  const skip = (batch - 1) * batchSize; // batch is 1-indexed
  return prisma.driverAllTimeRankingU0.findMany({
    orderBy: { u0_skill_intercept: 'desc' },
    skip: skip,
    take: batchSize,
  });
}

// Gets the total count for all-time rankings
async function getTotalAllTimeCount(): Promise<number> {
  return prisma.driverAllTimeRankingU0.count();
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


export default async function RankingsDashboardPage({
  searchParams,
}: {
  searchParams?: { year?: string; batch?: string };
}) {
  const availableYears = await getAvailableYears();
  const currentSelectedYear = searchParams?.year ? parseInt(searchParams.year) : (availableYears[0] || new Date().getFullYear());
  const currentBatchAllTime = searchParams?.batch ? parseInt(searchParams.batch) : 1;

  // Yearly Data (fetch all for client-side pagination)
  const yearlyRankingsRaw = await getAllRankingsForYear(currentSelectedYear);

  // All-Time Data (fetch current batch + total count)
  const allTimeRankingsBatchData = await getAllTimeRankingsBatch(currentBatchAllTime, BATCH_SIZE_ALL_TIME);
  const totalAllTimeDriverCount = await getTotalAllTimeCount();

  const topDriverHistory = await getTopDriverPerYearData();

  // --- Map data to the generic RankingData structure ---
  const yearlyTableData: RankingData[] = yearlyRankingsRaw.map(d => ({
    id: d.id.toString(),
    rank: d.yearly_rank,
    driverName: `${d.forename || ''} ${d.surname || ''}`.trim(),
    score: d.yearly_performance_score,
    driverId: d.driverid,
    year: d.year,
  }));

  const allTimeTableData: RankingData[] = allTimeRankingsBatchData.map((d, index) => ({
    id: d.id.toString(),
    // Rank in all-time is global, not just within the batch
    rank: (currentBatchAllTime - 1) * BATCH_SIZE_ALL_TIME + index + 1,
    driverName: `${d.forename || ''} ${d.surname || ''}`.trim(),
    score: d.u0_skill_intercept,
    driverId: d.driverid,
  }));

  const panelDefaultHeight = "h-[500px] sm:h-[550px]";
  const tableScrollHeight = "h-full overflow-y-auto";

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
          contentClassName="p-0 flex flex-col"
        >
          <RankingsDataTable
            tableType="yearly"
            columns={yearlyRankingsColumns}
            data={yearlyTableData} // All data for the year
            availableYears={availableYears}
            currentSelectedYear={currentSelectedYear}
            scrollAreaClass={tableScrollHeight}
            // clientSidePageSize={DEFAULT_CLIENT_PAGE_SIZE}
          />
        </DashboardPanel>

        {/* Panel 2: All Time Ranking Table */}
        <DashboardPanel
          title="All-Time Greats (Based on u0)"
          initialHeight={panelDefaultHeight}
          contentClassName="p-0 flex flex-col"
        >
          <RankingsDataTable
            tableType="all-time"
            columns={allTimeRankingsColumns}
            data={allTimeTableData} // Only the current batch
            totalAllTimeCount={totalAllTimeDriverCount}
            currentBatch={currentBatchAllTime}
            batchSize={BATCH_SIZE_ALL_TIME}
            scrollAreaClass={tableScrollHeight}
            // clientSidePageSize is not used for server-paginated table
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