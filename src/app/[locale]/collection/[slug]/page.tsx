/**
 * COLLECTION (BOOK) PAGE - src/app/[locale]/collection/[slug]/page.tsx
 * ====================================================================
 *
 * Displays a single collection as a "book": title + ordered list of posts (chapters).
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr, enUS, ja } from "date-fns/locale";
import {
  getAllCollectionSlugs,
  getCollectionInfo,
  getPostAvailableLocales,
  getPostCanonicalLocaleMap,
} from "@/lib/blog";
import { hasLocale, getDictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { locales } from "@/lib/i18n-config";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

const dateLocales = { fr, en: enUS, ja } as const;

export async function generateStaticParams() {
  const result: { slug: string; locale: string }[] = [];
  for (const locale of locales) {
    const slugs = getAllCollectionSlugs(locale);
    for (const slug of slugs) {
      result.push({ slug, locale });
    }
  }
  return result;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  if (!hasLocale(locale)) return { title: "Collection" };
  const { title } = getCollectionInfo(slug, locale);
  const dict = await getDictionary(locale);
  return {
    title: `${title} | ${dict.collections?.title ?? "Collection"} | nikki`,
    description: `${dict.collections?.title ?? "Collection"}: ${title}`,
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug, locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  const slugs = getAllCollectionSlugs(locale);
  if (!slugs.includes(slug)) {
    notFound();
  }

  const { title, posts } = getCollectionInfo(slug, locale);
  const dict = await getDictionary(locale);
  const canonicalMap = getPostCanonicalLocaleMap();

  const t = dict.collections ?? {
    title: "Collections",
    backToCollections: "Back to collections",
    backToPosts: "Back to journal",
    chapters: "Chapters",
    minRead: "min",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-16">
      <div className="mb-8 sm:mb-12">
        <Link
          href={`/${locale}/collections`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 mb-4"
        >
          <span>←</span>
          {t.backToCollections}
        </Link>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
          {title}
        </h1>
        <p className="text-muted-foreground">
          {posts.length} {posts.length === 1 ? (t.chapter ?? "chapter") : (t.chapters ?? "chapters")}
        </p>
      </div>

      <ul className="space-y-3" role="list">
        {posts.map((post, index) => {
          const linkLocale = canonicalMap[post.slug] ?? locale;
          const availableLocales = getPostAvailableLocales(post.slug);
          return (
            <li key={post.slug}>
              <Link href={`/${linkLocale}/posts/${post.slug}`}>
                <Card className="card-hover border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-sm font-medium tabular-nums">
                        {post.collectionOrder != null ? `${post.collectionOrder}.` : `${index + 1}.`}
                      </span>
                      <span className="ml-2 font-medium text-foreground group-hover:text-primary transition-colors">
                        {post.title}
                      </span>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5 ml-6 sm:ml-7">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground ml-6 sm:ml-0 sm:flex-shrink-0">
                      <time dateTime={post.date}>
                        {format(new Date(post.date), "MMM d, yyyy", {
                          locale: dateLocales[locale],
                        })}
                      </time>
                      <span>・</span>
                      <span>
                        {post.readingTime} {dict.post.minRead}
                      </span>
                      {availableLocales.length > 1 && (
                        <span className="text-muted-foreground/70" title="Available in multiple languages">
                          🌐
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={`/${locale}/collections`}>
          <Button variant="outline" className="border-primary/30 text-primary hover:!bg-primary hover:!text-primary-foreground">
            {t.backToCollections}
          </Button>
        </Link>
        <Link href={`/${locale}`}>
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            {t.backToPosts}
          </Button>
        </Link>
      </div>
    </div>
  );
}
