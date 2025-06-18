// components/ArticlePreviewCard.tsx
import Link from 'next/link';
import Image from 'next/image'; // Import Next.js Image component
import { ArticleMetadata } from '@/lib/mdx'; // Ensure this path is correct
import { format } from 'date-fns';

interface ArticlePreviewCardProps {
  article: ArticleMetadata;
  isFeatured?: boolean;
}

export function ArticlePreviewCard({ article, isFeatured = false }: ArticlePreviewCardProps) {
  const placeholderImageUrl = `/images/red-bull.webp`; // Default placeholder image URL

  return (
    // The Link component itself now receives the className and acts as the clickable area.
    // No need for legacyBehavior or a nested <a> tag for styling and behavior.
    <Link
      href={`/articles/${article.slug}`}
      className={`block bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col group ${isFeatured ? 'featured-article' : ''}`}
    >
      <div className={`aspect-video bg-slate-700 relative overflow-hidden ${isFeatured ? 'md:aspect-[16/7]' : 'aspect-video'}`}>
        <Image
          src={article.imageUrl || placeholderImageUrl} // Use article.imageUrl if you add it to your frontmatter
          alt={article.title || "F1 News"}
          fill // Changed from layout="fill" objectFit="cover" to just fill for Next 13+ Image
          // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes, adjust as needed
          style={{ objectFit: 'cover' }} // objectFit is now a style property
          className="group-hover:scale-105 transition-transform duration-300"
          priority
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className={`font-semibold mb-2 group-hover:text-red-400 transition-colors ${isFeatured ? 'text-xl md:text-2xl' : 'text-lg'}`}>
          {article.title}
        </h3>
        <p className={`text-slate-400 text-sm mb-2 flex-grow ${isFeatured ? 'md:text-base' : 'text-sm'}`}>
          {article.summary}
        </p>
        <p className="text-xs text-slate-500 mt-auto">
          {format(new Date(article.date), 'MMMM d, yyyy')}
          {article.author && ` by ${article.author}`}
        </p>
      </div>
    </Link>
  );
}