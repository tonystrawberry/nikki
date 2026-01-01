import { getAllPosts, getAllTags } from "@/lib/blog";
import { PostCard } from "@/components/PostCard";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const posts = getAllPosts();
  const tags = getAllTags();

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

      {/* Tags Section */}
      <section className="mb-12 opacity-0 animate-fade-in-up animation-delay-100">
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
          >
            All Posts
          </Badge>
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-border hover:border-primary/50 hover:text-primary cursor-pointer transition-colors"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </section>

      {/* Posts Grid */}
      <section>
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post, index) => (
              <div
                key={post.slug}
                className={`opacity-0 animate-fade-in-up ${
                  index === 0 ? 'animation-delay-200 md:col-span-2' :
                  index === 1 ? 'animation-delay-300' :
                  index === 2 ? 'animation-delay-400' : 'animation-delay-500'
                }`}
              >
                <PostCard post={post} featured={index === 0} />
              </div>
            ))}
          </div>
        )}
      </section>

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
