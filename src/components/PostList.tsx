"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { ActivityChart } from "@/components/ActivityChart";
import { CATEGORIES, type PostMeta, type Category } from "@/lib/types";

interface PostListProps {
  posts: PostMeta[];
}

export function PostList({ posts }: PostListProps) {
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [postsOnSelectedDate, setPostsOnSelectedDate] = useState<PostMeta[]>([]);

  const handleDateSelect = (date: Date | null, datePosts: PostMeta[]) => {
    setSelectedDate(date);
    setPostsOnSelectedDate(datePosts);
    // Reset category filter when selecting a date
    if (date) {
      setActiveCategory("all");
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setPostsOnSelectedDate([]);
  };

  // Filter posts based on category and date
  let filteredPosts = posts;

  if (selectedDate) {
    filteredPosts = postsOnSelectedDate;
  } else if (activeCategory !== "all") {
    filteredPosts = posts.filter((post) => post.category === activeCategory);
  }

  const categoryEntries = Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][];

  return (
    <>
      {/* Activity Chart Section */}
      <section className="mb-12 p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm opacity-0 animate-fade-in-up">
        <ActivityChart posts={posts} onDateSelect={handleDateSelect} />
      </section>

      {/* Date Filter Banner */}
      {selectedDate && (
        <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between opacity-0 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-medium">
                Showing posts from {format(selectedDate, "MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                {postsOnSelectedDate.length} {postsOnSelectedDate.length === 1 ? "post" : "posts"} found
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDateFilter}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            Clear filter ✕
          </Button>
        </div>
      )}

      {/* Categories Section - only show when no date is selected */}
      {!selectedDate && (
        <section className="mb-12 opacity-0 animate-fade-in-up animation-delay-100">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Browse by Category
          </h2>
          <div className="flex flex-wrap gap-3">
            {/* All Posts Button */}
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
                All
              </Badge>
            </button>

            {/* Category Buttons */}
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
                  {category.name}
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
              ? `Posts from ${format(selectedDate, "MMM d")}`
              : activeCategory === "all"
                ? "Latest Posts"
                : `${CATEGORIES[activeCategory].name} Posts`
            }
          </h2>
          <span className="text-sm text-muted-foreground opacity-0 animate-fade-in-up animation-delay-200">
            {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 opacity-0 animate-fade-in-up animation-delay-300">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-muted-foreground">
              {selectedDate
                ? "No posts on this day."
                : "No posts in this category yet."
              }
            </p>
            {selectedDate && (
              <Button
                variant="link"
                onClick={clearDateFilter}
                className="mt-2 text-primary"
              >
                View all posts
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
                <PostCard post={post} featured={index === 0 && activeCategory === "all" && !selectedDate} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
