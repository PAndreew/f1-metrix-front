import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
// import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown

const articlesDirectory = path.join(process.cwd(), 'content/articles');

export async function getArticleData(slug: string) {
  const fullPath = path.join(articlesDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const mdxSource = await serialize(content, {
    mdxOptions: { /* remarkPlugins: [remarkGfm] */ },
    parseFrontmatter: true,
  });
  return { slug, frontmatter: data, source: mdxSource };
}
// ... functions to get all article slugs, sorted article data, etc.