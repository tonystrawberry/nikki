"use client";

import { useState, useMemo } from "react";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, type PostMeta, type Category } from "@/lib/types";
import type { Locale, Dictionary } from "@/lib/i18n-config";

interface SearchPageProps {
  posts: PostMeta[];
  categories: Category[];
  tags: string[];
  locale: Locale;
  dict: Dictionary;
}

export function SearchPage({
  posts,
  categories,
  tags,
  locale,
  dict,
}: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (q) {
        const inTitle = post.title.toLowerCase().includes(q);
        const inExcerpt = post.excerpt.toLowerCase().includes(q);
        const inTags = post.tags.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inExcerpt && !inTags) return false;
      }
      if (category !== "all" && !post.categories.includes(category as Category)) return false;
      if (selectedTags.size > 0) {
        const hasAny = post.tags.some((t) => selectedTags.has(t));
        if (!hasAny) return false;
      }
      return true;
    });
  }, [posts, query, category, selectedTags]);

  const hasActiveFilters = query.trim() !== "" || category !== "all" || selectedTags.size > 0;

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setSelectedTags(new Set());
  };

  return (
    <section className="opacity-0 animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
        {dict.search.title}
      </h1>
      <p className="text-muted-foreground mb-6 sm:mb-8">
        {dict.search.subtitle}
      </p>

      {/* Free text search */}
      <div className="mb-4 sm:mb-6">
        <label htmlFor="search-query" className="sr-only">
          {dict.search.queryPlaceholder}
        </label>
        <input
          id="search-query"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.search.queryPlaceholder}
          className="w-full px-4 py-2.5 sm:py-2 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-base placeholder:text-muted-foreground"
          aria-label={dict.search.queryPlaceholder}
        />
      </div>

      {/* Category filter */}
      <div className="mb-4 sm:mb-6">
        <span className="text-sm font-medium text-muted-foreground block mb-2">
          {dict.search.categoryLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={category === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory("all")}
          >
            {dict.categories.all}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              <span className="mr-1">{CATEGORIES[cat].icon}</span>
              {dict.categories[cat as keyof typeof dict.categories]}
            </Button>
          ))}
        </div>
      </div>

      {/* Tags filter */}
      {tags.length > 0 && (
        <div className="mb-6">
          <span className="text-sm font-medium text-muted-foreground block mb-2">
            {dict.search.tagsLabel}
          </span>
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

      {/* Clear filters + results count */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {dict.filter.clearFilter}
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          {filteredPosts.length === 1
            ? `1 ${dict.filter.postFound}`
            : `${filteredPosts.length} ${dict.filter.postsFound}`}
        </span>
      </div>

      {/* Results grid */}
      {filteredPosts.length === 0 ? (
        <p className="text-muted-foreground py-8">
          {dict.search.noResults}
        </p>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.slug}
              post={post}
              locale={locale}
              linkLocale={locale}
              dict={dict}
              showUntranslatedNotice={false}
              showUntranslatedBorder={false}
            />
          ))}
        </div>
      )}
    </section>
  );
}
