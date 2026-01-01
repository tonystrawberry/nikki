import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/40">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col items-center gap-6">
          <div className="text-2xl font-semibold tracking-tight">
            <span className="text-gradient">sekai</span>
          </div>

          <p className="text-center text-muted-foreground max-w-md">
            Thoughts on technology, design, and building things that matter.
          </p>

          <Separator className="w-24 bg-border/50" />

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </a>
            <a
              href="/rss.xml"
              className="hover:text-primary transition-colors"
            >
              RSS
            </a>
          </div>

          <p className="text-sm text-muted-foreground/60">
            © {currentYear} sekai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
