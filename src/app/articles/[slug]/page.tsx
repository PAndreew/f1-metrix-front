// app/articles/[slug]/page.tsx
import { getAllArticleSlugs, getArticleDataBySlug, ArticleMetadata } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc'; // For App Router (RSC)
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { format } from 'date-fns';
// import remarkGfm from 'remark-gfm'; // Optional: for GitHub Flavored Markdown features like tables

// Optional: Define components you want to use within MDX
// import { YourCustomChart } from '@/components/YourCustomChart';
// const components = { YourCustomChart };


export async function generateStaticParams() {
  const slugs = getAllArticleSlugs(); // from lib/mdxUtils.ts
  return slugs; // [{ params: { slug: '...' } }, ...]
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getArticleDataBySlug(params.slug);
  if (!article) {
    return { title: 'Article Not Found' };
  }
  return {
    title: article.frontmatter.title,
    description: article.frontmatter.summary,
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const articleData = getArticleDataBySlug(params.slug);

  if (!articleData) {
    notFound(); // Triggers the not-found page
  }

  const { frontmatter, content } = articleData;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <article className="prose lg:prose-xl max-w-none dark:prose-invert"> {/* Apply prose styles */}
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{frontmatter.title}</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Published on {format(new Date(frontmatter.date), 'MMMM d, yyyy')}
              {frontmatter.author && ` by ${frontmatter.author}`}
            </p>
          </header>
          {/* @ts-ignore // MDXRemote types can sometimes be tricky with RSC setup */}
          <MDXRemote
            source={content}
            // components={components} // If you have custom components for MDX
            // options={{
            //   mdxOptions: {
            //     remarkPlugins: [remarkGfm],
            //   },
            // }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
}