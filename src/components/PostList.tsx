/**
 * POST LIST - src/components/PostList.tsx
 * =======================================
 *
 * A CLIENT COMPONENT that displays a filterable list of blog posts.
 *
 * WHY CLIENT COMPONENT?
 * ---------------------
 * This component needs:
 * - useState for active category and selected date
 * - User interaction (click handlers)
 *
 * Server Components can't use hooks or handle events.
 *
 * "use client" DIRECTIVE:
 * - MUST be at the very top of the file
 * - Tells Next.js to bundle this for the browser
 * - Enables React hooks and event handlers
 * - Children can still be Server Components
 *
 * DATA FLOW:
 * 1. Server Component (page.tsx) fetches posts with getAllPosts()
 * 2. Posts are passed as props to this Client Component
 * 3. Client handles filtering/sorting without re-fetching
 *
 * WHAT THIS COMPONENT DOES:
 * - Displays activity chart (all posts across locales)
 * - Category filter buttons
 * - Date filter (when clicking chart)
 * - Responsive post grid
 * - Empty states
 */
"use client";

// React hooks for state management
import { useState, useMemo } from "react";

// date-fns for date parsing and formatting
import { format, parseISO, isSameDay } from "date-fns";
// Locale-specific date formatting (French, English, Japanese)
import { fr, enUS, ja } from "date-fns/locale";

// UI Components (from shadcn/ui)
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Our components
import { PostCard } from "@/components/PostCard";
import { ActivityChart } from "@/components/ActivityChart";

// Types - imported from types.ts (NOT blog.ts, which has server code)
import { CATEGORIES, type PostMeta, type Category } from "@/lib/types";

// i18n types - from config file (NOT i18n.ts which is server-only)
import { type Locale, type Dictionary } from "@/lib/i18n-config";

// ============================================================================
// TYPES
// ============================================================================

/**
 * COMPONENT PROPS
 *
 * Props are the interface between parent (Server) and child (Client).
 * Server Component fetches data, Client Component displays it.
 */
interface PostListProps {
  /** Posts in current locale - for displaying in the list */
  posts: PostMeta[];

  /** All posts across all locales - for the activity chart */
  allPostsForChart: PostMeta[];

  /** Current locale for date formatting */
  locale: Locale;

  /** Translations dictionary - passed from Server Component */
  dict: Dictionary;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * DATE LOCALE MAP
 *
 * Maps our locale codes to date-fns locale objects.
 * Used for localized date formatting (e.g., "janvier" vs "January").
 */
const dateLocales = {
  fr: fr,
  en: enUS,
  ja: ja,
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * PostList Component
 *
 * @param posts - Posts in current locale
 * @param allPostsForChart - All posts for activity chart
 * @param locale - Current language
 * @param dict - Translations
 */
export function PostList({ posts, allPostsForChart, locale, dict }: PostListProps) {
  /**
   * STATE: Active Category
   *
   * useState creates a reactive variable.
   * When it changes, React re-renders the component.
   *
   * "all" | Category means: either "all" or one of the category keys
   */
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  /**
   * STATE: Selected Date
   *
   * null = no date filter
   * Date = filter posts to this specific day
   */
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  /**
   * MEMOIZED: Posts in current locale (as Set of slugs)
   *
   * useMemo caches the result of expensive computations.
   * Only recalculates when `posts` changes.
   *
   * WHY? To quickly check if a post is translated to current locale.
   */
  const localeSlugs = useMemo(() => {
    return new Set(posts.map(p => p.slug));
  }, [posts]);

  /**
   * MEMOIZED: Posts on selected date
   *
   * Filters allPostsForChart (all locales) by the selected date.
   * This shows posts even if they're not translated to current locale.
   */
  const postsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return allPostsForChart.filter(post => isSameDay(parseISO(post.date), selectedDate));
  }, [allPostsForChart, selectedDate]);

  /**
   * EVENT HANDLER: Date selected from chart
   *
   * When user clicks a day on the activity chart:
   * - Set the selected date
   * - Reset category filter to "all"
   */
  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setActiveCategory("all"); // Reset category when filtering by date
    }
  };

  /**
   * EVENT HANDLER: Clear date filter
   */
  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  /**
   * COMPUTED: Filtered posts
   *
   * This is NOT memoized because it depends on multiple states.
   * React will recalculate on every render, which is fast enough.
   */
  let filteredPosts = posts;

  if (selectedDate) {
    // Date filter takes priority - show all posts on that date
    filteredPosts = postsOnSelectedDate;
  } else if (activeCategory !== "all") {
    // Category filter - show posts in that category
    filteredPosts = posts.filter((post) => post.category === activeCategory);
  }

  /**
   * HELPER: Check if post is translated to current locale
   *
   * Used to show "Original" badge on untranslated posts.
   */
  const isTranslated = (slug: string) => localeSlugs.has(slug);

  /**
   * CATEGORIES AS ARRAY
   *
   * Object.entries() converts { key: value } to [[key, value], ...]
   * The `as` cast helps TypeScript understand the tuple types.
   */
  const categoryEntries = Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/*
        ACTIVITY CHART SECTION

        Shows GitHub-style contribution chart.
        Uses allPostsForChart (all locales) so chart is consistent across languages.

        CSS Classes:
        - mb-8 sm:mb-12: responsive margin-bottom (spacing)
        - p-3 sm:p-6: responsive padding
        - rounded-xl sm:rounded-2xl: responsive rounded corners
        - bg-card/50: semi-transparent card background
        - border border-border/50: subtle border
        - backdrop-blur-sm: frosted glass effect
        - opacity-0 animate-fade-in-up: entrance animation
        - overflow-x-auto: allow horizontal scroll on very small screens
      */}
      <section className="mb-8 sm:mb-12 p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm opacity-0 animate-fade-in-up overflow-x-auto">
        <ActivityChart
          posts={allPostsForChart}
          onDateSelect={handleDateSelect}
          locale={locale}
          dict={dict}
        />
      </section>

      {/*
        DATE FILTER BANNER

        Only shown when a date is selected.
        Shows the date and how many posts were found.
        Includes a "Clear" button.
      */}
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

      {/*
        CATEGORY FILTER SECTION

        Only shown when NOT filtering by date.
        Displays buttons for each category.

        WHY BUTTONS INSIDE BADGES?
        - Badge provides consistent styling
        - Button wrapper handles click events
        - focus:outline-none removes ugly focus ring
      */}
      {!selectedDate && (
        <section className="mb-8 sm:mb-12 opacity-0 animate-fade-in-up animation-delay-100">
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">
            {dict.home.browseByCategory}
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* "All" button */}
            <button
              onClick={() => setActiveCategory("all")}
              className="focus:outline-none"
            >
              <Badge
                variant="outline"
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all cursor-pointer ${
                  activeCategory === "all"
                    ? "border-primary bg-primary/10 text-primary" // Active state
                    : "border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5" // Hover state
                }`}
              >
                <span className="mr-1.5 sm:mr-2 text-sm sm:text-base">✨</span>
                {dict.categories.all}
              </Badge>
            </button>

            {/* Category buttons */}
            {categoryEntries.map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className="focus:outline-none"
              >
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

      {/*
        POSTS GRID SECTION

        The main content area showing post cards.
      */}
      <section>
        {/* Header with title and count */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider opacity-0 animate-fade-in-up animation-delay-200">
            {selectedDate
              ? `${dict.filter.showingPostsFrom} ${format(selectedDate, "MMM d", { locale: dateLocales[locale] })}`
              : activeCategory === "all"
                ? dict.home.latestPosts
                : `${dict.categories[activeCategory as keyof typeof dict.categories]}`
            }
          </h2>
          <span className="text-xs sm:text-sm text-muted-foreground opacity-0 animate-fade-in-up animation-delay-200">
            {filteredPosts.length} {filteredPosts.length === 1 ? dict.home.post : dict.home.posts}
          </span>
        </div>

        {/*
          EMPTY STATE

          Shown when no posts match the current filter.
          Different messages for date filter vs category filter.
        */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-10 sm:py-16 opacity-0 animate-fade-in-up animation-delay-300">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📭</div>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedDate ? dict.filter.noPostsOnDay : dict.home.noPostsInCategory}
            </p>
            {selectedDate && (
              <Button
                variant="link"
                onClick={clearDateFilter}
                className="mt-2 text-primary text-sm"
              >
                {dict.filter.viewAllPosts}
              </Button>
            )}
          </div>
        ) : (
          /*
            POSTS GRID

            grid gap-4 sm:gap-6: CSS Grid with responsive gap
            md:grid-cols-2: 2 columns on medium+ screens

            First post is "featured" (spans 2 columns) when showing all posts.
          */
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {filteredPosts.map((post, index) => (
              <div
                key={post.slug}
                className={`opacity-0 animate-fade-in-up ${
                  // Featured post (first, all category, no date filter) spans 2 columns
                  index === 0 && activeCategory === "all" && !selectedDate ? 'animation-delay-200 md:col-span-2' :
                  // Staggered animation delays for entrance effect
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
                  showUntranslatedNotice={!isTranslated(post.slug)} // Show "Original" badge
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
