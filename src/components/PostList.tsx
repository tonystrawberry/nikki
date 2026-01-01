"use client";

import { useState, useMemo } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { fr, enUS, ja } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { ActivityChart } from "@/components/ActivityChart";
import { CATEGORIES, type PostMeta, type Category } from "@/lib/types";
import { type Locale, type Dictionary } from "@/lib/i18n-config";

interface PostListProps {
  posts: PostMeta[];
  allPostsForChart: PostMeta[];
  locale: Locale;
  dict: Dictionary;
}

const dateLocales = {
  fr: fr,
  en: enUS,
  ja: ja,
};

export function PostList({ posts, allPostsForChart, locale, dict }: PostListProps) {
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const localeSlugs = useMemo(() => {
    return new Set(posts.map(p => p.slug));
  }, [posts]);

  const postsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return allPostsForChart.filter(post => isSameDay(parseISO(post.date), selectedDate));
  }, [allPostsForChart, selectedDate]);

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setActiveCategory("all");
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  let filteredPosts = posts;

  if (selectedDate) {
    filteredPosts = postsOnSelectedDate;
  } else if (activeCategory !== "all") {
    filteredPosts = posts.filter((post) => post.category === activeCategory);
  }

  const isTranslated = (slug: string) => localeSlugs.has(slug);

  const categoryEntries = Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][];

  return (
    <>
      {/* Activity Chart Section */}
      <section className="mb-12 p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm opacity-0 animate-fade-in-up">
        <ActivityChart posts={allPostsForChart} onDateSelect={handleDateSelect} locale={locale} dict={dict} />
      </section>

      {/* Date Filter Banner */}
      {selectedDate && (
        <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between opacity-0 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-medium">
                {dict.filter.showingPostsFrom} {format(selectedDate, "MMMM d, yyyy", { locale: dateLocales[locale] })}
              </p>
              <p className="text-sm text-muted-foreground">
                {postsOnSelectedDate.length} {postsOnSelectedDate.length === 1 ? dict.filter.postFound : dict.filter.postsFound}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDateFilter}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            {dict.filter.clearFilter}
          </Button>
        </div>
      )}

      {/* Categories Section */}
      {!selectedDate && (
        <section className="mb-12 opacity-0 animate-fade-in-up animation-delay-100">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            {dict.home.browseByCategory}
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveCategory("all")}
              className="focus:outline-none"
            >
              <Badge
                variant="outline"
                className={`px-4 py-2 text-sm transition-all cursor-pointer ${
                  activeCategory === "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                }`}
              >
                <span className="mr-2 text-base">✨</span>
                {dict.categories.all}
              </Badge>
            </button>

            {categoryEntries.map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className="focus:outline-none"
              >
                <Badge
                  variant="outline"
                  className={`px-4 py-2 text-sm transition-all cursor-pointer ${
                    activeCategory === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  <span className="mr-2 text-base">{category.icon}</span>
                  {dict.categories[key as keyof typeof dict.categories]}
                </Badge>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Posts Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider opacity-0 animate-fade-in-up animation-delay-200">
            {selectedDate
              ? `${dict.filter.showingPostsFrom} ${format(selectedDate, "MMM d", { locale: dateLocales[locale] })}`
              : activeCategory === "all"
                ? dict.home.latestPosts
                : `${dict.categories[activeCategory as keyof typeof dict.categories]}`
            }
          </h2>
          <span className="text-sm text-muted-foreground opacity-0 animate-fade-in-up animation-delay-200">
            {filteredPosts.length} {filteredPosts.length === 1 ? dict.home.post : dict.home.posts}
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 opacity-0 animate-fade-in-up animation-delay-300">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-muted-foreground">
              {selectedDate ? dict.filter.noPostsOnDay : dict.home.noPostsInCategory}
            </p>
            {selectedDate && (
              <Button
                variant="link"
                onClick={clearDateFilter}
                className="mt-2 text-primary"
              >
                {dict.filter.viewAllPosts}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredPosts.map((post, index) => (
              <div
                key={post.slug}
                className={`opacity-0 animate-fade-in-up ${
                  index === 0 && activeCategory === "all" && !selectedDate ? 'animation-delay-200 md:col-span-2' :
                  index === 0 ? 'animation-delay-200' :
                  index === 1 ? 'animation-delay-300' :
                  index === 2 ? 'animation-delay-400' : 'animation-delay-500'
                }`}
              >
                <PostCard
                  post={post}
                  featured={index === 0 && activeCategory === "all" && !selectedDate}
                  locale={locale}
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
