// app/rankings/page.tsx
import { Footer } from "@/components/footer";
import prisma from "@/lib/prisma";
import { DriverCard } from "@/components/driver-card"; // Reuse for consistency if desired
import { YearSelector } from "@/components/year-selector"; // You created this for homepage

async function getRankingsForYear(year: number) {
  const rankings = await prisma.driverYearlyPerformanceRankings.findMany({
    where: { year: year },
    orderBy: { yearly_rank: 'asc' },
  });
  return rankings;
}

async function getAvailableYears() {
    const yearsData = await prisma.driverYearlyPerformanceRankings.groupBy({
        by: ['year'],
        orderBy: { year: 'desc' },
        _count: { year: true }, // Ensure there's data for the year
    });
    return yearsData.filter(y => y._count.year > 0).map(y => y.year);
}


export default async function RankingsPage({ searchParams }: { searchParams?: { year?: string } }) {
  const availableYears = await getAvailableYears();
  const currentSelectedYear = searchParams?.year ? parseInt(searchParams.year) : (availableYears[0] || new Date().getFullYear());
  const rankings = await getRankingsForYear(currentSelectedYear);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Driver Rankings - {currentSelectedYear}
        </h1>
        <YearSelector availableYears={availableYears} currentYear={currentSelectedYear} />

        <div className="mt-8">
          {rankings.length > 0 ? (
            <div className="space-y-4">
              {rankings.map((driver, index) => (
                // You can use the DriverCard or a more table-like structure here
                <DriverCard key={driver.id} driver={driver} rank={index + 1} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No rankings found for {currentSelectedYear}.</p>
          )}
        </div>
        <p className="mt-8 text-center text-muted-foreground">
          Detailed charts and further data displays will be available here.
        </p>
      </main>
      <Footer />
    </div>
  );
}