// app/rankings/[driverId]/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
// import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CareerRankingsChart } from "@/components/career-rankings-chart";
import { DriverAttributesChart, AttributeData } from "@/components/driver-attributes-chart";
import { YearSelector } from "@/components/year-selector";
import { DriverCareerEffects, DriverYearlyPerformanceRankings } from "@prisma/client";
import { Metadata } from 'next';

// --- Data Fetching (can be moved to a lib/driverData.ts) ---
interface DriverProfilePageData {
    driverId: string; // Include driverId for potential future use
  driverInfo: DriverCareerEffects;
  careerRankings: { year: number; rank: number | null; score: number | null }[];
  attributesForSelectedYear: DriverYearlyPerformanceRankings | null;
  participationYears: number[];
  selectedAttributeYear: number;
}

// interface ResolvedPageParams {
//   driverId: string;
// }

// interface ResolvedSearchParams {
//   [key: string]: string | string[] | undefined;
// }

interface ResolvedPageParams {
  driverId: string;
}

interface ResolvedSearchParams {
  attr_year?: string; // Explicitly define expected search params
  [key: string]: string | string[] | undefined; // Allow others
}

interface PromisedProps {
  params: Promise<ResolvedPageParams>;
  searchParams?: Promise<ResolvedSearchParams>; // searchParams promise itself can be optional
}

// Keep this function signature as is
async function getDriverPageData(driverIdParam: string, attributeYearParam?: string): Promise<DriverProfilePageData | null> {
  const driverId = driverIdParam; // Parse inside the async function
  if (!driverId) {
    console.error("Invalid driverIdParam:", driverIdParam);
    return null;
  }

  const driverInfo = await prisma.driverCareerEffects.findUnique({
    where: { driverid: driverId },
  });

  if (!driverInfo) {
    console.error("Driver info not found for ID:", driverId);
    return null;
  }

  const careerRankingsRaw = await prisma.driverYearlyPerformanceRankings.findMany({
    where: { driverid: driverId },
    orderBy: { year: 'asc' },
    select: { year: true, yearly_rank: true, yearly_performance_score: true },
  });
  const careerRankings = careerRankingsRaw.map(r => ({
    year: r.year,
    rank: r.yearly_rank,
    score: r.yearly_performance_score,
  }));

  const participationYears = [...new Set(careerRankingsRaw.map(r => r.year))].sort((a,b) => a-b);

  let selectedAttributeYear: number;
  // Parse attributeYearParam inside the function
  const attrYearNum = attributeYearParam ? parseInt(attributeYearParam) : NaN;

  if (!isNaN(attrYearNum) && participationYears.includes(attrYearNum)) {
    selectedAttributeYear = attrYearNum;
  } else {
    selectedAttributeYear = participationYears.length > 0 ? participationYears[participationYears.length - 1] : (new Date().getFullYear());
  }

  const attributesForSelectedYear = await prisma.driverYearlyPerformanceRankings.findFirst({
    where: { driverid: driverId, year: selectedAttributeYear },
  });

  return {
    driverId, // Include driverId for potential future use
    driverInfo,
    careerRankings,
    attributesForSelectedYear,
    participationYears,
    selectedAttributeYear,
  };
}

export async function generateMetadata(
  { params: paramsPromise }: Pick<PromisedProps, 'params'>,
): Promise<Metadata> {
  const params = await paramsPromise;
  const pageData = await getDriverPageData(params.driverId);

   if (!pageData) { // Check for null first
    notFound(); // This will correctly throw and stop execution
  }

  if (!pageData.driverId) return { title: 'Driver Not Found - Invalid ID' };

  const driverInfo = await prisma.driverCareerEffects.findUnique({ where: { driverid: pageData.driverId } });
  if (!driverInfo) return { title: 'Driver Not Found' };
  return {
    title: `${driverInfo.forename} ${driverInfo.surname} - F1 Profile`,
    description: `Career statistics and performance analysis for ${driverInfo.forename} ${driverInfo.surname}.`
  };
}


export default async function DriverProfilePage({
  params: paramsPromise,
  searchParams: searchParamsPromise, // Destructure searchParamsPromise correctly
}: PromisedProps) { // Use PromisedProps
  const params = await paramsPromise;
  
  // Await searchParamsPromise IF it's provided. If not, default to an empty object.
  const resolvedSearchParams = searchParamsPromise ? await searchParamsPromise : {};

  const driverIdParam = params.driverId;
  const attributeYearParam = resolvedSearchParams?.attr_year as string | undefined;



  const driverPageData = await getDriverPageData(driverIdParam, attributeYearParam);

  if (!driverPageData) {
    notFound();
  }

  const { driverInfo, careerRankings, attributesForSelectedYear, participationYears, selectedAttributeYear } = driverPageData;

  const driverFullName = `${driverInfo.forename || ''} ${driverInfo.surname || ''}`.trim();
//   const avatarUrl = `https://via.placeholder.com/150/475569/FFFFFF?Text=${driverInfo.forename?.[0]}${driverInfo.surname?.[0]}`;

  const attributeChartData: AttributeData | null = attributesForSelectedYear ? {
    u0_contrib: attributesForSelectedYear.u0_contrib,
    u1_year_contrib: attributesForSelectedYear.u1_year_contrib,
    age_contrib: attributesForSelectedYear.age_contrib,
    exp_contrib: attributesForSelectedYear.exp_contrib,
  } : null;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <div className="flex-shrink-0">
          {/* <Image
            src={avatarUrl}
            alt={`${driverFullName} Avatar`}
            width={150}
            height={150}
            className="rounded-full border-4 border-slate-700"
            priority
          /> */}
        </div>
        <div>
          <h1 className="text-4xl font-bold font-highlight">{driverFullName}</h1>
          <p className="text-xl text-slate-400">F1 Driver Profile</p>
          <div className="mt-3 text-sm text-slate-300">
            <p>Base Skill (u0): <span className="font-semibold text-sky-400">{driverInfo.u0_skill_intercept?.toFixed(3)}</span></p>
            <p>Skill Trend (u1): <span className="font-semibold text-amber-400">{driverInfo.u1_skill_trend?.toFixed(3)}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2 bg-slate-800 text-white">
          <CardHeader>
            <CardTitle>Career Ranking Trajectory</CardTitle>
            <CardDescription>Driver&#39;s final rank in each participated F1 season.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] p-2 sm:p-4">
            {careerRankings.length > 0 ? (
              <CareerRankingsChart data={careerRankings} driverName={driverFullName} />
            ) : (
              <p className="text-center text-slate-400">No career ranking data available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-slate-800 text-white">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div>
                    <CardTitle>Performance Attributes Breakdown</CardTitle>
                    <CardDescription>Contribution of different factors to the performance score.</CardDescription>
                </div>
                <div className="mt-3 sm:mt-0">
                    {participationYears.length > 0 && (
                        <YearSelector // This component is client-side
                        availableYears={participationYears}
                        currentYear={selectedAttributeYear}
                        queryParamName="attr_year" // Pass the server-resolved year
                        />
                    )}
                </div>
            </div>
          </CardHeader>
          <CardContent className="h-[450px] p-2 sm:p-4">
            <DriverAttributesChart data={attributeChartData} year={selectedAttributeYear} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}