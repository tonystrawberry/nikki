import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "About | sekai",
  description: "Learn more about sekai and the person behind the blog.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="opacity-0 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          About <span className="text-gradient">sekai</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          A digital garden where ideas grow and evolve.
        </p>
      </div>

      <Separator className="my-12 opacity-0 animate-fade-in-up animation-delay-100" />

      <div className="space-y-8 opacity-0 animate-fade-in-up animation-delay-200">
        <section>
          <h2 className="text-2xl font-semibold mb-4">The Philosophy</h2>
          <div className="prose">
            <p>
              In Japanese, <strong>sekai (世界)</strong> means "world" or "universe." This blog
              is my little corner of the digital universe—a space to explore ideas, share
              knowledge, and connect with curious minds.
            </p>
            <p>
              I believe in the power of long-form content. In an age of endless scrolling
              and fleeting attention, there's something valuable about taking the time to
              think deeply and write thoroughly.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">What I Write About</h2>
          <div className="prose">
            <p>
              This blog covers a range of topics that I find fascinating:
            </p>
            <ul>
              <li><strong>Technology & Development</strong> — Deep dives into tools, frameworks, and best practices</li>
              <li><strong>Design</strong> — Thoughts on creating beautiful, functional experiences</li>
              <li><strong>Building in Public</strong> — Behind-the-scenes looks at projects I'm working on</li>
              <li><strong>Learning</strong> — Notes and reflections on books, courses, and discoveries</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">The Stack</h2>
          <div className="prose">
            <p>
              This blog is built with modern web technologies:
            </p>
            <ul>
              <li><strong>Next.js 15</strong> — React framework with App Router</li>
              <li><strong>Tailwind CSS</strong> — Utility-first styling</li>
              <li><strong>shadcn/ui</strong> — Beautiful, accessible components</li>
              <li><strong>gray-matter</strong> — Markdown frontmatter parsing</li>
              <li><strong>Vercel</strong> — Deployment and hosting</li>
            </ul>
            <p>
              The source code is open and available on GitHub. Feel free to use it as
              inspiration for your own projects.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Connect</h2>
          <div className="prose">
            <p>
              I'd love to hear from you! You can find me on:
            </p>
            <ul>
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a> — For quick thoughts and updates</li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a> — For code and collaboration</li>
              <li><a href="mailto:hello@example.com">Email</a> — For longer conversations</li>
            </ul>
          </div>
        </section>
      </div>

      <div className="mt-16 p-8 rounded-2xl bg-card/50 border border-border/50 text-center opacity-0 animate-fade-in-up animation-delay-300">
        <p className="text-lg text-muted-foreground">
          Thanks for stopping by. Happy reading! ✨
        </p>
      </div>
    </div>
  );
}
