import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr, enUS, ja } from "date-fns/locale";
import { getAllPostSlugs, getPostBySlugWithFallback, getPostAvailableLocales } from "@/lib/blog";
import { CATEGORIES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type Locale, locales, hasLocale, getDictionary, localeFlags, localeNames } from "@/lib/i18n";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

const dateLocales = {
  fr: fr,
  en: enUS,
  ja: ja,
};

export async function generateStaticParams() {
  const frenchSlugs = getAllPostSlugs('fr');
  const params: { slug: string; locale: string }[] = [];
  
  for (const slug of frenchSlugs) {
    for (const locale of locales) {
      params.push({ slug, locale });
    }
  }
  
  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  
  if (!hasLocale(locale)) {
    return { title: "Not Found" };
  }
  
  const result = await getPostBySlugWithFallback(slug, locale);

  if (!result) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${result.post.title} | nikki`,
    description: result.post.excerpt,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug, locale } = await params;
  
  if (!hasLocale(locale)) {
    notFound();
  }
  
  const result = await getPostBySlugWithFallback(slug, locale);
  const dict = await getDictionary(locale);

  if (!result) {
    notFound();
  }

  const { post, actualLocale } = result;
  const isShowingFallback = actualLocale !== locale;
  const category = CATEGORIES[post.category];
  const availableLocales = getPostAvailableLocales(slug);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {/* Back Button */}
      <div className="mb-8 opacity-0 animate-fade-in-up">
        <Link href={`/${locale}`}>
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
              <path d="m15 18-6-6 6-6" />
            </svg>
            {dict.post.backToPosts}
          </Button>
        </Link>
      </div>

      {/* Fallback Language Notice */}
      {isShowingFallback && (
        <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 opacity-0 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{localeFlags[actualLocale]}</span>
            <div>
              <p className="font-medium text-amber-200">
                {locale === 'en' 
                  ? 'This article is not yet available in English'
                  : locale === 'ja'
                  ? 'この記事はまだ日本語では利用できません'
                  : "Cet article n'est pas encore disponible en français"
                }
              </p>
              <p className="text-sm text-amber-200/70">
                {locale === 'en'
                  ? `Showing the ${localeNames[actualLocale]} version`
                  : locale === 'ja'
                  ? `${localeNames[actualLocale]}版を表示しています`
                  : `Affichage de la version ${localeNames[actualLocale]}`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-12 opacity-0 animate-fade-in-up animation-delay-100">
        {/* Category */}
        <Badge className="mb-4 bg-secondary/80 text-secondary-foreground hover:bg-secondary border-0">
          <span className="mr-1.5">{category.icon}</span>
          {dict.categories[post.category as keyof typeof dict.categories]}
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
                {format(new Date(post.date), "MMMM d, yyyy", { locale: dateLocales[actualLocale] })} · {post.readingTime} {dict.post.minRead}
              </p>
            </div>
          </div>
        </div>

        {/* Available translations */}
        {availableLocales.length > 1 && (
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">
              {locale === 'fr' ? 'Aussi disponible en' : locale === 'ja' ? '他の言語' : 'Also available in'}:
            </span>
            {availableLocales
              .filter((l) => l !== locale && l !== actualLocale)
              .map((l) => (
                <Link
                  key={l}
                  href={`/${l}/posts/${slug}`}
                  className="text-lg hover:scale-110 transition-transform"
                  title={localeNames[l]}
                >
                  {localeFlags[l]}
                </Link>
              ))}
          </div>
        )}

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
            <h3 className="font-semibold text-lg mb-1">{dict.post.writtenBy} {post.author}</h3>
            <p className="text-muted-foreground mb-3">
              {dict.footer.tagline}
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
        <Link href={`/${locale}`}>
          <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
            {dict.post.viewAllPosts}
          </Button>
        </Link>
      </div>
    </article>
  );
}
