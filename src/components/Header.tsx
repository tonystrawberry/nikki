"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { type Locale, type Dictionary } from "@/lib/i18n-config";

interface HeaderProps {
  locale: Locale;
  dict: Dictionary;
}

export function Header({ locale, dict }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl px-6">
        <nav className="flex h-16 items-center justify-between">
          <Link
            href={`/${locale}`}
            className="text-xl font-semibold tracking-tight transition-colors hover:text-primary"
          >
            <span className="text-gradient">nikki</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href={`/${locale}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {dict.nav.posts}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {dict.nav.about}
            </Link>
            <LanguageSwitcher currentLocale={locale} />
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {dict.nav.subscribe}
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
