// lib/mdxUtils.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseISO, compareDesc } from 'date-fns';

const articlesDirectory = path.join(process.cwd(), 'src/content/articles');

export interface ArticleMetadata {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  summary: string;
  author?: string;
  imageUrl?: string;
}

export function getAllArticleSlugs(): Array<{ slug: string }> { // This can remain synchronous
  const fileNames = fs.readdirSync(articlesDirectory);
  return fileNames.map((fileName) => {
    return {
      // No 'params' key here, just the slug itself for generateStaticParams
      slug: fileName.replace(/\.mdx$/, ''),
    };
  });
}

// Make this function async
export async function getArticleDataBySlug(slug: string) {
  const fullPath = path.join(articlesDirectory, `${slug}.mdx`);
  // Asynchronous check for file existence is generally better practice
  try {
    await fs.promises.access(fullPath, fs.constants.F_OK); // Check if file exists and is accessible
  } catch (_error) {
    console.warn(`Article not found or inaccessible: ${fullPath}`, _error);
    return null; // File does not exist or not accessible
  }

  const fileContents = await fs.promises.readFile(fullPath, 'utf8'); // Use async readFile
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data as ArticleMetadata, // Cast to your defined type
    content,
  };
}

export function getAllArticlesMetadata(count?: number): ArticleMetadata[] { // This can remain synchronous
  const fileNames = fs.readdirSync(articlesDirectory);
  const allArticlesData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, '');
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8'); // Sync is okay here for bulk metadata
    const { data } = matter(fileContents);
    return {
      slug,
      ...(data as Omit<ArticleMetadata, 'slug'>),
    };
  });

  const sortedArticles = allArticlesData.sort((a, b) => {
    return compareDesc(parseISO(a.date), parseISO(b.date));
  });

  if (count) {
    return sortedArticles.slice(0, count);
  }
  return sortedArticles;
}