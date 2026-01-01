import { notFound } from "next/navigation";
import { getAllPosts, getAllPostsAcrossLocales } from "@/lib/blog";
import { PostList } from "@/components/PostList";
import { type Locale, hasLocale, getDictionary } from "@/lib/i18n";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  
  if (!hasLocale(locale)) {
    notFound();
  }
  
  const posts = getAllPosts(locale);
  const allPosts = getAllPostsAcrossLocales();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Hero Section */}
      <section className="mb-16 opacity-0 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          {dict.home.welcome}{" "}
          <span className="text-gradient">nikki</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          {dict.home.tagline}
        </p>
      </section>

      {/* Posts with Category Filter */}
      <PostList posts={posts} allPostsForChart={allPosts} locale={locale} dict={dict} />

      {/* Newsletter Section */}
      <section className="mt-20 p-8 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm opacity-0 animate-fade-in-up animation-delay-500">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-3">{dict.home.stayUpdated}</h2>
          <p className="text-muted-foreground mb-6">
            {dict.home.stayUpdatedDesc}
          </p>
          <form className="flex gap-3">
            <input
              type="email"
              placeholder={dict.home.emailPlaceholder}
              className="flex-1 px-4 py-2 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              {dict.nav.subscribe}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
