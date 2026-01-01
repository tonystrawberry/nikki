import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PostMeta } from "@/lib/blog";

interface PostCardProps {
  post: PostMeta;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  return (
    <Link href={`/posts/${post.slug}`}>
      <Card className={`card-hover group border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden ${featured ? 'md:col-span-2' : ''}`}>
        {post.coverImage && (
          <div className="relative aspect-[2/1] overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>
        )}
        <CardContent className={`${post.coverImage ? 'pt-4' : 'pt-6'} pb-6`}>
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-medium bg-secondary/80 hover:bg-primary/20 hover:text-primary transition-colors"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <h2 className={`font-semibold tracking-tight mb-2 group-hover:text-primary transition-colors ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
            {post.title}
          </h2>

          <p className="text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent" />
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center gap-3">
              <time dateTime={post.date}>
                {format(new Date(post.date), "MMM d, yyyy")}
              </time>
              <span className="text-border">·</span>
              <span>{post.readingTime}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
