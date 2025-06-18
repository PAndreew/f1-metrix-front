// app/articles/[slug]/page.tsx
import { getAllArticleSlugs, getArticleDataBySlug } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/footer';
import { format } from 'date-fns';

// Define the shape of the resolved params
interface ResolvedPageParams {
  slug: string;
}

// Define the type for the params prop as it's received by the async page/metadata function
// This indicates that Next.js might be providing it as a Promise that resolves to ResolvedPageParams
type AsyncPageParamsProp = Promise<ResolvedPageParams>; // Or Promise<{ slug: string; }> directly

// Define the overall props for the page component
interface ArticlePageProps {
  params: AsyncPageParamsProp; // params itself is a Promise
  // searchParams?: { [key: string]: string | string[] | undefined };
}


export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const articles = getAllArticleSlugs();
  return articles.map(article => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params: paramsPromise }: ArticlePageProps) {
  const params = await paramsPromise; // Await the promise to get the actual slug object
  const article = await getArticleDataBySlug(params.slug);

  if (!article) { // Check for null before accessing frontmatter
    return { title: 'Article Not Found' };
  }
  return {
    title: article.frontmatter.title,
    description: article.frontmatter.summary,
  };
}

export default async function ArticlePage({ params: paramsPromise }: ArticlePageProps) {
  const params = await paramsPromise; // Await the promise to get the actual slug object
  const articleData = await getArticleDataBySlug(params.slug);


  if (!articleData) { // Check for null first
    notFound(); // This will correctly throw and stop execution
  }

  // If we reach here, articleData is guaranteed to be non-null
  // so we can safely destructure.
  const { frontmatter, content } = articleData;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-8">
        <article className="prose lg:prose-xl max-w-none dark:prose-invert">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{frontmatter.title}</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Published on {format(new Date(frontmatter.date), 'MMMM d, yyyy')}
              {frontmatter.author && ` by ${frontmatter.author}`}
            </p>
          </header>
          <MDXRemote source={content} />
        </article>
      </main>
      <Footer />
    </div>
  );
}