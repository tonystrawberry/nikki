/**
 * COLLECTIONS INDEX - src/app/[locale]/collections/page.tsx
 * =========================================================
 *
 * Lists all collections (books/stories) that have at least one post.
 * Each collection groups posts (e.g. DDIA chapter notes) into a single "book".
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllCollectionSlugs, getCollectionInfo } from "@/lib/blog";
import { hasLocale, getDictionary } from "@/lib/i18n";
import { locales } from "@/lib/i18n-config";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(locale)) return { title: "Collections" };
  const dict = await getDictionary(locale);
  return {
    title: `${dict.collections?.title ?? "Collections"} | nikki`,
    description: dict.collections?.subtitle ?? "Browse posts grouped as books and series.",
  };
}

export default async function CollectionsPage({ params }: PageProps) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const slugs = getAllCollectionSlugs(locale);

  const collections = slugs.map((slug) => {
    const { title, posts } = getCollectionInfo(slug, locale);
    return { slug, title, postCount: posts.length };
  });

  const t = dict.collections ?? {
    title: "Collections",
    subtitle: "Posts grouped as books and series.",
    backToPosts: "Back to journal",
    noCollections: "No collections yet.",
    chapters: "chapters",
    chapter: "chapter",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-16">
      <div className="mb-8 sm:mb-12">
        <Link
          href={`/${locale}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 mb-4"
        >
          <span>←</span>
          {t.backToPosts}
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {collections.length === 0 ? (
        <p className="text-muted-foreground">{t.noCollections}</p>
      ) : (
        <ul className="space-y-4">
          {collections.map(({ slug, title, postCount }) => (
            <li key={slug}>
              <Link href={`/${locale}/collection/${slug}`}>
                <Card className="card-hover border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-lg sm:text-xl tracking-tight group-hover:text-primary transition-colors">
                        {title}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {postCount} {postCount === 1 ? t.chapter : t.chapters}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-sm sm:self-center">→</span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
