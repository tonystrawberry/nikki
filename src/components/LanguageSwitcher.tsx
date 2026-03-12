"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { type Locale, locales, localeNames, localeFlags } from "@/lib/i18n-config";

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const lastNavigatedLocale = useRef<Locale | null>(null);

  useEffect(() => {
    if (!pendingLocale || pendingLocale === lastNavigatedLocale.current) return;
    lastNavigatedLocale.current = pendingLocale;
    document.cookie = `NEXT_LOCALE=${pendingLocale};path=/;max-age=31536000`;
    const segments = pathname.split('/');
    segments[1] = pendingLocale;
    router.push(segments.join('/'));
  }, [pendingLocale, pathname, router]);

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => setPendingLocale(locale)}
          className={`
            px-2 py-1 text-sm rounded-md transition-all cursor-pointer
            ${currentLocale === locale
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }
          `}
          title={localeNames[locale]}
        >
          {localeFlags[locale]}
        </button>
      ))}
    </div>
  );
}
