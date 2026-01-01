import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";
import { CATEGORIES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} | sekai`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const category = CATEGORIES[post.category];

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {/* Back Button */}
      <div className="mb-8 opacity-0 animate-fade-in-up">
        <Link href="/">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground -ml-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to posts
          </Button>
        </Link>
      </div>

      {/* Header */}
      <header className="mb-12 opacity-0 animate-fade-in-up animation-delay-100">
        {/* Category */}
        <Badge className="mb-4 bg-secondary/80 text-secondary-foreground hover:bg-secondary border-0">
          <span className="mr-1.5">{category.icon}</span>
          {category.name}
        </Badge>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent" />
            <div>
              <p className="font-medium text-foreground">{post.author}</p>
              <p className="text-sm">
                {format(new Date(post.date), "MMMM d, yyyy")} · {post.readingTime}
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs border-border/50 text-muted-foreground"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="mb-12 -mx-6 md:-mx-12 opacity-0 animate-fade-in-up animation-delay-200">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-auto rounded-xl md:rounded-2xl"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose opacity-0 animate-fade-in-up animation-delay-300"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <Separator className="my-12" />

      {/* Author Bio */}
      <div className="p-6 rounded-xl bg-card/50 border border-border/50 opacity-0 animate-fade-in-up animation-delay-400">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-lg mb-1">Written by {post.author}</h3>
            <p className="text-muted-foreground mb-3">
              Building things on the internet. Writing about technology, design, and the journey of creation.
            </p>
            <div className="flex gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Twitter
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Posts */}
      <div className="mt-12 text-center opacity-0 animate-fade-in-up animation-delay-500">
        <Link href="/">
          <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
            ← View all posts
          </Button>
        </Link>
      </div>
    </article>
  );
}
