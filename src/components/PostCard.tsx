import Link from "next/link";
import { format } from "date-fns";
import { fr, enUS, ja } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, type PostMeta } from "@/lib/types";
import { type Locale, type Dictionary } from "@/lib/i18n-config";

interface PostCardProps {
  post: PostMeta;
  featured?: boolean;
  locale: Locale;
  dict: Dictionary;
  showUntranslatedNotice?: boolean;
}

const dateLocales = {
  fr: fr,
  en: enUS,
  ja: ja,
};

const untranslatedMessages: Record<Locale, string> = {
  fr: "Pas encore traduit en français",
  en: "Not yet translated to English",
  ja: "日本語への翻訳はまだありません",
};

export function PostCard({ post, featured = false, locale, dict, showUntranslatedNotice = false }: PostCardProps) {
  const category = CATEGORIES[post.category];

  return (
    <Link href={`/${locale}/posts/${post.slug}`}>
      <Card className={`card-hover group border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden ${featured ? 'md:col-span-2' : ''} ${showUntranslatedNotice ? 'border-amber-500/30' : ''}`}>
        {post.coverImage && (
          <div className="relative aspect-[2/1] overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${showUntranslatedNotice ? 'opacity-70' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90 border-0">
                <span className="mr-1.5">{category.icon}</span>
                {dict.categories[post.category as keyof typeof dict.categories]}
              </Badge>
              {showUntranslatedNotice && (
                <Badge className="bg-amber-500/80 backdrop-blur-sm text-white hover:bg-amber-500/90 border-0">
                  🌐 {locale === 'fr' ? 'Original' : locale === 'ja' ? '原文' : 'Original'}
                </Badge>
              )}
            </div>
          </div>
        )}
        <CardContent className={`${post.coverImage ? 'pt-4' : 'pt-6'} pb-6`}>
          {!post.coverImage && (
            <div className="flex gap-2 mb-3">
              <Badge className="bg-secondary/80 text-secondary-foreground hover:bg-secondary border-0">
                <span className="mr-1.5">{category.icon}</span>
                {dict.categories[post.category as keyof typeof dict.categories]}
              </Badge>
              {showUntranslatedNotice && (
                <Badge className="bg-amber-500/80 text-white hover:bg-amber-500/90 border-0">
                  🌐 {locale === 'fr' ? 'Original' : locale === 'ja' ? '原文' : 'Original'}
                </Badge>
              )}
            </div>
          )}

          <h2 className={`font-semibold tracking-tight mb-2 group-hover:text-primary transition-colors ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
            {post.title}
          </h2>

          <p className="text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {post.excerpt}
          </p>

          {showUntranslatedNotice && (
            <p className="text-xs text-amber-400 mb-3 flex items-center gap-1">
              <span>⚠️</span>
              {untranslatedMessages[locale]}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent" />
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center gap-3">
              <time dateTime={post.date}>
                {format(new Date(post.date), "MMM d, yyyy", { locale: dateLocales[locale] })}
              </time>
              <span className="text-border">·</span>
              <span>{post.readingTime} {dict.post.minRead}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
