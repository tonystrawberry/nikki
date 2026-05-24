"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { type Locale, type Dictionary } from "@/lib/i18n-config";

interface HeaderProps {
  locale: Locale;
  dict: Dictionary;
}

export function Header({ locale, dict }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <nav className="flex h-14 sm:h-16 items-center justify-between">
          <Link
            href={`/${locale}`}
            className="text-xl font-semibold tracking-tight transition-colors hover:text-primary"
          >
            <span className="text-gradient">nikki</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href={`/${locale}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {dict.nav.posts}
            </Link>
            <Link
              href={`/${locale}/search`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {dict.nav.search}
            </Link>
            <Link
              href={`/${locale}/collections`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {dict.nav.collections}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {dict.nav.about}
            </Link>
            <Link
              href={`/${locale}/todo`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {dict.nav.todo}
            </Link>
            <Link
              href={`/${locale}/chat`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {dict.nav.chat}
            </Link>
            <LanguageSwitcher currentLocale={locale} />
            <a
              href="https://buttondown.email/tonystrawberry"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {dict.nav.subscribe}
              </Button>
            </a>
          </div>

          {/* Mobile: Language + Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher currentLocale={locale} />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="20" y1="12" y2="12"/>
                  <line x1="4" x2="20" y1="6" y2="6"/>
                  <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/40 py-4 animate-fade-in-up">
            <div className="flex flex-col gap-4">
              <Link
                href={`/${locale}`}
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
              >
                {dict.nav.posts}
              </Link>
              <Link
                href={`/${locale}/search`}
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
              >
                {dict.nav.search}
              </Link>
              <Link
                href={`/${locale}/collections`}
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
              >
                {dict.nav.collections}
              </Link>
              <Link
                href={`/${locale}/about`}
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
              >
                {dict.nav.about}
              </Link>
              <Link
                href={`/${locale}/todo`}
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
              >
                {dict.nav.todo}
              </Link>
              <Link
                href={`/${locale}/chat`}
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
              >
                {dict.nav.chat}
              </Link>
              <a
                href="https://buttondown.email/tonystrawberry"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {dict.nav.subscribe}
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
