// app/articles/[slug]/page.tsx
import { getAllArticleSlugs, getArticleDataBySlug } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/footer';
import { format } from 'date-fns';

export async function generateStaticParams() {
  const articles = getAllArticleSlugs();
  return articles.map(article => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await getArticleDataBySlug(params.slug); // article can be { data... } or null

  if (!article) { // Check for null before accessing frontmatter
    return { title: 'Article Not Found' };
  }
  return {
    title: article.frontmatter.title,
    description: article.frontmatter.summary,
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const articleData = await getArticleDataBySlug(params.slug); // articleData can be { data... } or null

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