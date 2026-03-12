import { Separator } from "@/components/ui/separator";
import { type Dictionary } from "@/lib/i18n-config";

interface FooterProps {
  dict: Dictionary;
}

export function Footer({ dict }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/40">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <div className="text-xl sm:text-2xl font-semibold tracking-tight">
            <span className="text-gradient">nikki</span>
          </div>

          <p className="text-center text-sm sm:text-base text-muted-foreground max-w-md px-4">
            {dict.footer.tagline}
          </p>

          <Separator className="w-16 sm:w-24 bg-border/50" />

          <div className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
            <a
              href="mailto:tony.duong.102@gmail.com"
              className="hover:text-primary transition-colors"
            >
              Email
            </a>
            <a
              href="https://github.com/tonystrawberry"
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

          <p className="text-xs sm:text-sm text-muted-foreground/60">
            © {currentYear} nikki. {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
