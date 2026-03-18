import { notFound } from "next/navigation";
import { getAllPosts, getAllCategories, getAllTags } from "@/lib/blog";
import { SearchPage } from "@/components/SearchPage";
import { hasLocale, getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";

interface SearchPageRouteProps {
  params: Promise<{ locale: string }>;
}

export default async function SearchRoute({ params }: SearchPageRouteProps) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  const posts = getAllPosts(locale as Locale);
  const categories = getAllCategories();
  const tags = getAllTags(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-16">
      <SearchPage
        posts={posts}
        categories={categories}
        tags={tags}
        locale={locale as Locale}
        dict={dict}
      />
    </div>
  );
}
