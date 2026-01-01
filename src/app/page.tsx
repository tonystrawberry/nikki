import { getAllPosts } from "@/lib/blog";
import { PostList } from "@/components/PostList";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Hero Section */}
      <section className="mb-16 opacity-0 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Welcome to{" "}
          <span className="text-gradient">sekai</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          A space for exploring ideas about technology, design, and the craft of
          building things that matter. Dive into long-form thoughts and tutorials.
        </p>
      </section>

      {/* Posts with Category Filter */}
      <PostList posts={posts} />

      {/* Newsletter Section */}
      <section className="mt-20 p-8 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm opacity-0 animate-fade-in-up animation-delay-500">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-3">Stay Updated</h2>
          <p className="text-muted-foreground mb-6">
            Get notified when I publish new articles. No spam, unsubscribe anytime.
          </p>
          <form className="flex gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-2 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
