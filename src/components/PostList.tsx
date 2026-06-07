/**
 * POST LIST - src/components/PostList.tsx
 * =======================================
 *
 * The Journal (home) page body. A CLIENT COMPONENT that renders:
 * - the activity chart
 * - a tab control (Articles / Collections / Search) — see JournalTabs
 * - the active tab's panel (category chips / collections list / search controls)
 * - the post grid, which stays visible across all three tabs
 *
 * Collections and Search are embedded here rather than living on their own
 * routes, so the article grid is always available no matter the active tab.
 */
"use client";

import { useState, useMemo } from "react";

import { format, parseISO, isSameDay } from "date-fns";
import { fr, enUS, ja } from "date-fns/locale";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { PostCard } from "@/components/PostCard";
import { ActivityChart } from "@/components/ActivityChart";
import { JournalTabs, type JournalTab } from "@/components/JournalTabs";

import { CATEGORIES, type PostMeta, type Category } from "@/lib/types";

import { type Locale, type Dictionary } from "@/lib/i18n-config";

// ============================================================================
// TYPES
// ============================================================================

/** Lightweight collection summary for the Collections tab. */
export interface CollectionSummary {
  slug: string;
  title: string;
  postCount: number;
}

interface PostListProps {
  /** Posts in current locale - for displaying in the list */
  posts: PostMeta[];

  /** All posts across all locales - for the activity chart */
  allPostsForChart: PostMeta[];

  /** Map of slug → canonical locale, used to link untranslated posts correctly */
  postCanonicalLocales: Record<string, Locale>;

  /** Collections (books/series) in current locale - for the Collections tab */
  collections: CollectionSummary[];

  /** All category keys - for the Search tab filter */
  categories: Category[];

  /** All tags in current locale - for the Search tab filter */
  tags: string[];

  /** Current locale for date formatting */
  locale: Locale;

  /** Translations dictionary - passed from Server Component */
  dict: Dictionary;
}

const dateLocales = {
  fr: fr,
  en: enUS,
  ja: ja,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PostList({
  posts,
  allPostsForChart,
  postCanonicalLocales,
  collections,
  categories,
  tags,
  locale,
  dict,
}: PostListProps) {
  const [activeTab, setActiveTab] = useState<JournalTab>("articles");

  // Articles tab: category filter
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  // Search tab: free text + category + tags
  const [query, setQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<Category | "all">("all");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Activity chart: date filter
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const localeSlugs = useMemo(() => new Set(posts.map((p) => p.slug)), [posts]);

  const postsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return allPostsForChart.filter((post) => isSameDay(parseISO(post.date), selectedDate));
  }, [allPostsForChart, selectedDate]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (q) {
        const inTitle = post.title.toLowerCase().includes(q);
        const inExcerpt = post.excerpt.toLowerCase().includes(q);
        const inTags = post.tags.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inExcerpt && !inTags) return false;
      }
      if (searchCategory !== "all" && !post.categories.includes(searchCategory)) return false;
      if (selectedTags.size > 0 && !post.tags.some((t) => selectedTags.has(t))) return false;
      return true;
    });
  }, [posts, query, searchCategory, selectedTags]);

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setActiveTab("articles");
      setActiveCategory("all");
    }
  };

  const clearDateFilter = () => setSelectedDate(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  // ---- Which posts the grid shows -----------------------------------------
  let filteredPosts = posts;
  if (selectedDate) {
    filteredPosts = postsOnSelectedDate;
  } else if (activeTab === "search") {
    filteredPosts = searchResults;
  } else if (activeTab === "articles" && activeCategory !== "all") {
    filteredPosts = posts.filter((post) => post.categories.includes(activeCategory));
  }

  const isTranslated = (slug: string) => localeSlugs.has(slug);
  const isFeatured = (index: number) =>
    index === 0 && activeTab === "articles" && activeCategory === "all" && !selectedDate;

  const categoryEntries = Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][];

  const gridHeading = selectedDate
    ? `${dict.filter.showingPostsFrom} ${format(selectedDate, "MMM d", { locale: dateLocales[locale] })}`
    : activeTab === "articles" && activeCategory !== "all"
      ? dict.categories[activeCategory as keyof typeof dict.categories]
      : dict.home.latestPosts;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Activity chart (always visible) */}
      <section className="mb-8 sm:mb-12 p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm opacity-0 animate-fade-in-up overflow-x-auto">
        <ActivityChart posts={allPostsForChart} onDateSelect={handleDateSelect} locale={locale} dict={dict} />
      </section>

      {/* Date filter banner */}
      {selectedDate && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-0 animate-fade-in-up">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">📅</span>
            <div>
              <p className="font-medium text-sm sm:text-base">
                {dict.filter.showingPostsFrom} {format(selectedDate, "MMM d, yyyy", { locale: dateLocales[locale] })}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {postsOnSelectedDate.length} {postsOnSelectedDate.length === 1 ? dict.filter.postFound : dict.filter.postsFound}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDateFilter}
            className="text-primary hover:text-primary hover:bg-primary/10 self-end sm:self-auto text-sm"
          >
            {dict.filter.clearFilter}
          </Button>
        </div>
      )}

      {/* Tabs: Articles / Collections / Search (above "browse by theme") */}
      {!selectedDate && (
        <JournalTabs
          active={activeTab}
          onChange={setActiveTab}
          labels={dict.journalTabs}
        />
      )}

      {/* ---- Tab panels ------------------------------------------------------ */}

      {/* Articles → browse by theme */}
      {!selectedDate && activeTab === "articles" && (
        <section className="mb-8 sm:mb-12 opacity-0 animate-fade-in-up animation-delay-100">
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">
            {dict.home.browseByCategory}
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button onClick={() => setActiveCategory("all")} className="focus:outline-none">
              <Badge
                variant="outline"
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all cursor-pointer ${
                  activeCategory === "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                }`}
              >
                <span className="mr-1.5 sm:mr-2 text-sm sm:text-base">✨</span>
                {dict.categories.all}
              </Badge>
            </button>
            {categoryEntries.map(([key, category]) => (
              <button key={key} onClick={() => setActiveCategory(key)} className="focus:outline-none">
                <Badge
                  variant="outline"
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all cursor-pointer ${
                    activeCategory === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  <span className="mr-1.5 sm:mr-2 text-sm sm:text-base">{category.icon}</span>
                  {dict.categories[key as keyof typeof dict.categories]}
                </Badge>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Collections → list of books/series */}
      {!selectedDate && activeTab === "collections" && (
        <section className="mb-8 sm:mb-12 opacity-0 animate-fade-in-up animation-delay-100">
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">
            {dict.collections.title}
          </h2>
          {collections.length === 0 ? (
            <p className="text-muted-foreground text-sm">{dict.collections.noCollections}</p>
          ) : (
            <ul className="space-y-3 sm:space-y-4">
              {collections.map(({ slug, title, postCount }) => (
                <li key={slug}>
                  <Link href={`/${locale}/collection/${slug}`} className="group block">
                    <Card className="card-hover border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg tracking-tight group-hover:text-primary transition-colors">
                            📚 {title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {postCount} {postCount === 1 ? dict.collections.chapter : dict.collections.chapters}
                          </p>
                        </div>
                        <span className="text-muted-foreground text-sm">→</span>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Search → free text + category + tags */}
      {!selectedDate && activeTab === "search" && (
        <section className="mb-8 sm:mb-12 opacity-0 animate-fade-in-up animation-delay-100">
          <div className="mb-4">
            <label htmlFor="journal-search" className="sr-only">
              {dict.search.queryPlaceholder}
            </label>
            <input
              id="journal-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.search.queryPlaceholder}
              className="w-full px-4 py-2.5 sm:py-2 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-base placeholder:text-muted-foreground"
              aria-label={dict.search.queryPlaceholder}
            />
          </div>

          <div className="mb-4">
            <span className="text-sm font-medium text-muted-foreground block mb-2">{dict.search.categoryLabel}</span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={searchCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchCategory("all")}
              >
                {dict.categories.all}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={searchCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSearchCategory(cat)}
                >
                  <span className="mr-1">{CATEGORIES[cat].icon}</span>
                  {dict.categories[cat as keyof typeof dict.categories]}
                </Button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground block mb-2">{dict.search.tagsLabel}</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.has(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ---- Post grid (always visible) ------------------------------------- */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider opacity-0 animate-fade-in-up animation-delay-200">
            {gridHeading}
          </h2>
          <span className="text-xs sm:text-sm text-muted-foreground opacity-0 animate-fade-in-up animation-delay-200">
            {filteredPosts.length} {filteredPosts.length === 1 ? dict.home.post : dict.home.posts}
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-10 sm:py-16 opacity-0 animate-fade-in-up animation-delay-300">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📭</div>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedDate
                ? dict.filter.noPostsOnDay
                : activeTab === "search"
                  ? dict.search.noResults
                  : dict.home.noPostsInCategory}
            </p>
            {selectedDate && (
              <Button variant="link" onClick={clearDateFilter} className="mt-2 text-primary text-sm">
                {dict.filter.viewAllPosts}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {filteredPosts.map((post, index) => (
              <div
                key={post.slug}
                className={`opacity-0 animate-fade-in-up ${
                  isFeatured(index)
                    ? "animation-delay-200 md:col-span-2"
                    : index === 0
                      ? "animation-delay-200"
                      : index === 1
                        ? "animation-delay-300"
                        : index === 2
                          ? "animation-delay-400"
                          : "animation-delay-500"
                }`}
              >
                <PostCard
                  post={post}
                  featured={isFeatured(index)}
                  locale={locale}
                  linkLocale={isTranslated(post.slug) ? locale : (postCanonicalLocales[post.slug] ?? locale)}
                  dict={dict}
                  showUntranslatedNotice={!isTranslated(post.slug)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
