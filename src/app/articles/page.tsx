// app/page.tsx
import { getAllArticlesMetadata, ArticleMetadata } from '@/lib/mdx'; // Ensure path is correct
import { Footer } from '@/components/footer'; // Ensure path is correct
import { ArticlePreviewCard } from '@/components/article-preview-card'; // Ensure path is correct

async function getArticles(count?: number): Promise<ArticleMetadata[]> {
  return getAllArticlesMetadata(count); // This already sorts by date
}

export default async function HomePage() {
  const allArticles = await getArticles(); // Fetch all articles (or a larger number like 7-10)

  // Articles for the grid, excluding the featured one
  const moreArticles = allArticles.length > 0 ? allArticles.slice(0, 9) : []; // Show up to 6 more (2 rows of 3)

  return (
    // Note: Header is in RootLayout, Footer is here for flex-grow behavior of main
    <div className="flex flex-col min-h-screen"> {/* This is from RootLayout's body */}
      <main className="flex-grow container mx-auto px-4 py-8">

        {/* More Articles Section */}
        {moreArticles.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6 text-center md:text-left border-b border-slate-700 pb-3 font-highlight">
              More Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {moreArticles.map((article) => (
                <ArticlePreviewCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}