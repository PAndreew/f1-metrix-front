// app/page.tsx
import prisma from '@/lib/prisma';
import { getAllArticlesMetadata, ArticleMetadata } from '@/lib/mdx';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArticlePreviewCard } from '@/components/article-preview-card';
import { RankingSidebar } from '@/components/ranking-sidebar';
import { DriverYearlyPerformanceRankings } from '@prisma/client';

async function getLatestArticles(count: number = 3): Promise<ArticleMetadata[]> {
  return getAllArticlesMetadata(count);
}

async function getYtdRankings(year: number, count: number = 5): Promise<DriverYearlyPerformanceRankings[]> {
  try {
    const rankings = await prisma.driverYearlyPerformanceRankings.findMany({
      where: { year: year },
      orderBy: { yearly_rank: 'asc' },
      take: count,
    });
    return rankings;
  } catch (error) {
    console.error("Failed to fetch YTD rankings:", error);
    return [];
  }
}

export default async function HomePage() {
  const currentYear = new Date().getFullYear(); // Or determine dynamically the latest year with data
  const latestArticles = await getLatestArticles(3); // Fetch 3 latest articles
  const ytdRankings = await getYtdRankings(currentYear, 5); // Fetch top 5 for current year

  const latestArticle = latestArticles.length > 0 ? latestArticles[0] : null;
  const secondArticle = latestArticles.length > 1 ? latestArticles[1] : null;
  const thirdArticle = latestArticles.length > 2 ? latestArticles[2] : null;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Latest Article - takes more space on larger screens */}
          {latestArticle && (
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Latest Article</h2>
              <ArticlePreviewCard article={latestArticle} />
            </div>
          )}

          {/* YTD Ranking Sidebar */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">YTD Ranking</h2>
            <RankingSidebar rankings={ytdRankings} year={currentYear} />
          </div>

          {/* Second Article */}
          {secondArticle && (
            <div className="md:col-span-3 lg:col-span-1"> {/* Spans full on medium, 1/3 on large */}
               {/* <h2 className="text-xl font-semibold mb-3">More Articles</h2> */}
              <ArticlePreviewCard article={secondArticle} />
            </div>
          )}

          {/* Third Article */}
          {thirdArticle && (
             <div className="md:col-span-3 lg:col-span-1">  {/* Spans full on medium, 1/3 on large */}
              <ArticlePreviewCard article={thirdArticle} />
            </div>
          )}
          {/* You might want a 4th article here for a 2x2 grid below the main feature + sidebar on desktop */}
           {/* Placeholder for a potential 4th article to make the grid even on larger screens if desired */}
           {latestArticles.length > 3 && ( // Only if there's a 4th article
             <div className="md:col-span-3 lg:col-span-1">
               <ArticlePreviewCard article={latestArticles[3]} />
             </div>
           )}
        </div>
      </main>
      <Footer />
    </div>
  );
}