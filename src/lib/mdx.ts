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
}

export function getAllArticleSlugs() {
  const fileNames = fs.readdirSync(articlesDirectory);
  return fileNames.map((fileName) => {
    return {
      params: {
        slug: fileName.replace(/\.mdx$/, ''),
      },
    };
  });
}

export function getArticleDataBySlug(slug: string) {
  const fullPath = path.join(articlesDirectory, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) {
    return null; // Handle case where article doesn't exist
  }
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data as ArticleMetadata, // Cast to your defined type
    content,
  };
}

export function getAllArticlesMetadata(count?: number): ArticleMetadata[] {
  const fileNames = fs.readdirSync(articlesDirectory);
  const allArticlesData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, '');
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);
    return {
      slug,
      ...(data as Omit<ArticleMetadata, 'slug'>), // Spread frontmatter, slug is already there
    };
  });

  // Sort articles by date in descending order
  const sortedArticles = allArticlesData.sort((a, b) => {
    return compareDesc(parseISO(a.date), parseISO(b.date));
  });

  if (count) {
    return sortedArticles.slice(0, count);
  }
  return sortedArticles;
}