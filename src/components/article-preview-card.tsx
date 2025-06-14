// components/ArticlePreviewCard.tsx
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArticleMetadata } from '@/lib/mdx'; // Import your type
import { Button } from './ui/button';
import { format } from 'date-fns';

interface ArticlePreviewCardProps {
  article: ArticleMetadata;
}

export function ArticlePreviewCard({ article }: ArticlePreviewCardProps) {
  return (
    <Card className="flex flex-col h-full"> {/* Ensure card takes full height of its grid cell */}
      <CardHeader>
        <CardTitle>{article.title}</CardTitle>
        <CardDescription>
          {format(new Date(article.date), 'MMMM d, yyyy')}
          {article.author && ` by ${article.author}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow"> {/* Allow content to grow */}
        <p>{article.summary}</p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="link" className="p-0">
          <Link href={`/articles/${article.slug}`}>Read More →</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}