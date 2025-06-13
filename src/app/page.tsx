// app/page.tsx
import prisma from '@/lib/prisma';
import { DriverCard } from '@/components/driver-card'; // You'll create this
import { YearSelector } from '@/components/year-selector'; // You'll create this

async function getRankingsForYear(year: number) {
  const rankings = await prisma.driverYearlyPerformanceRankings.findMany({
    where: { year: year },
    orderBy: { yearly_rank: 'asc' },
    // include: { driver: true } // If you set up a relation to a Driver table
  });
  return rankings;
}

async function getAvailableYears() {
    const yearsData = await prisma.driverYearlyPerformanceRankings.groupBy({
        by: ['year'],
        orderBy: { year: 'desc' },
    });
    return yearsData.map(y => y.year);
}

export default async function HomePage({ searchParams }: { searchParams?: { year?: string } }) {
  const availableYears = await getAvailableYears();
  const currentYear = searchParams?.year ? parseInt(searchParams.year) : (availableYears[0] || new Date().getFullYear() -1); // Default to latest available year or previous year
  const yearlyRankings = await getRankingsForYear(currentYear);

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        F1 Driver Rankings - {currentYear}
      </h1>
      <YearSelector availableYears={availableYears} currentYear={currentYear} />

      <div className="space-y-4 mt-6">
        {yearlyRankings.map((driver, index) => (
          <DriverCard key={driver.id} driver={driver} rank={index + 1} />
        ))}
        {yearlyRankings.length === 0 && <p>No rankings found for {currentYear}.</p>}
      </div>
    </main>
  );
}