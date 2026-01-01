"use client";

import { usePathname, useRouter } from "next/navigation";
import { type Locale } from "@/lib/i18n-config";

// Client-side constants (no server-only imports)
const locales: Locale[] = ['fr', 'en', 'ja'];
const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ja: '日本語',
};
const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ja: '🇯🇵',
};

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLocaleChange = (newLocale: Locale) => {
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;

    // Replace the locale in the pathname
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');

    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
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
