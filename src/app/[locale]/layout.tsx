/**
 * LOCALE LAYOUT - src/app/[locale]/layout.tsx
 * ============================================
 *
 * This layout wraps ALL pages under the [locale] dynamic route.
 * It's responsible for:
 * 1. Validating the locale parameter
 * 2. Loading the correct translation dictionary
 * 3. Setting up fonts and the HTML structure
 * 4. Rendering the Header and Footer
 *
 * DYNAMIC ROUTE SEGMENTS:
 * -----------------------
 * The [locale] folder name creates a DYNAMIC SEGMENT.
 * - URL: /fr/about → params.locale = 'fr'
 * - URL: /en/posts/hello → params.locale = 'en'
 *
 * This single layout handles ALL three locales (fr, en, ja) because
 * the folder name is dynamic, not hardcoded.
 *
 * WHY IS params A PROMISE?
 * ------------------------
 * In Next.js 15+, dynamic params are Promises for better streaming support.
 * We must await them: const { locale } = await params;
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
// next/font provides AUTOMATIC font optimization
// - Self-hosts fonts (no external requests to Google)
// - Eliminates layout shift (size-adjust applied)
// - Fonts are preloaded for performance
import { Outfit, Crimson_Pro, JetBrains_Mono } from "next/font/google";

// Import global styles for this layout branch
import "../globals.css";

// Our components
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// i18n utilities - these use 'server-only' so can ONLY be imported in Server Components
import { locales, hasLocale, getDictionary, type Locale } from "@/lib/i18n";

/**
 * FONT CONFIGURATION
 * ==================
 *
 * next/font/google provides automatic optimization:
 * - Fonts are downloaded at BUILD time, not runtime
 * - Self-hosted from your domain (no CORS, privacy)
 * - CSS `size-adjust` prevents layout shift
 * - Fonts are preloaded in <head>
 *
 * The `variable` option creates a CSS custom property (--font-sans)
 * that we can use in Tailwind config or CSS.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/fonts
 */
const outfit = Outfit({
  subsets: ["latin"],      // Only load Latin characters (smaller file)
  variable: "--font-sans", // CSS variable name: var(--font-sans)
  display: "swap",         // Show fallback font immediately, swap when loaded
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/**
 * generateStaticParams - STATIC SITE GENERATION (SSG)
 * ====================================================
 *
 * This function tells Next.js which locale values exist at BUILD time.
 * Next.js will pre-render pages for each returned value.
 *
 * Without this, pages would be generated on-demand (slower first visit).
 * With this, pages are pre-built as static HTML (instant, cacheable).
 *
 * RETURNS: Array of param objects matching the dynamic segment name
 *
 * For [locale], we return: [{ locale: 'fr' }, { locale: 'en' }, { locale: 'ja' }]
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-static-params
 */
export async function generateStaticParams() {
  // `locales` is ['fr', 'en', 'ja'] from our i18n config
  return locales.map((locale) => ({ locale }));
}

/**
 * Props type for this layout
 *
 * In Next.js 15+, params is a Promise that must be awaited.
 * This is for better streaming and concurrent rendering support.
 */
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // Note: Promise, not direct object
}

/**
 * generateMetadata - DYNAMIC METADATA
 * ====================================
 *
 * This function generates the <title>, <meta> tags, etc. for SEO.
 * It runs on the server and can be async (fetch data for metadata).
 *
 * The metadata is locale-aware - different languages get different titles.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata
 */
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;

  // Validate locale before using
  if (!hasLocale(locale)) {
    return { title: "nikki" };
  }

  // Load translations for this locale
  const dict = await getDictionary(locale);

  return {
    title: "nikki | " + dict.footer.tagline,
    description: dict.home.tagline,
    keywords: ["blog", "diary", "journal", "personal"],
  };
}

/**
 * LocaleLayout Component
 * ======================
 *
 * This is a SERVER COMPONENT (no "use client").
 * It can:
 * - Be async (use await)
 * - Call server-only functions (getDictionary)
 * - Access the file system
 *
 * It CANNOT:
 * - Use useState, useEffect, or other hooks
 * - Handle user events (onClick, etc.)
 */
export default async function LocaleLayout({
  children,
  params,
}: LayoutProps) {
  // Await params (required in Next.js 15+)
  const { locale } = await params;

  /**
   * LOCALE VALIDATION
   *
   * hasLocale() is a TYPE GUARD that:
   * 1. Returns true if locale is valid ('fr' | 'en' | 'ja')
   * 2. Narrows the TypeScript type from `string` to `Locale`
   *
   * If invalid locale (like /xyz/about), show 404 page.
   * notFound() throws a special error that Next.js catches.
   */
  if (!hasLocale(locale)) {
    notFound(); // Shows src/app/not-found.tsx or default 404
  }

  /**
   * LOAD TRANSLATIONS
   *
   * getDictionary() dynamically imports the correct JSON file:
   * - 'fr' → imports dictionaries/fr.json
   * - 'en' → imports dictionaries/en.json
   * - 'ja' → imports dictionaries/ja.json
   *
   * This is SERVER-SIDE ONLY. The JSON is never sent to the client
   * as JavaScript - only the rendered HTML/text is sent.
   */
  const dict = await getDictionary(locale);

  return (
    /**
     * HTML ELEMENT
     *
     * - lang={locale}: Important for accessibility & SEO
     *   Screen readers use this to pronounce text correctly
     *
     * - className="dark": We're using dark mode by default
     *   This triggers the .dark {} CSS variables in globals.css
     */
    <html lang={locale} className="dark">
      <body
        className={`
          ${outfit.variable}
          ${crimsonPro.variable}
          ${jetbrainsMono.variable}
          min-h-screen
          flex flex-col
          gradient-bg
          font-sans
        `}
        // CSS variable classes from next/font
        // Minimum full viewport height
        // Flexbox column for sticky footer
        // Custom gradient background
        // Use Outfit as default font
      >
        {/*
          HEADER COMPONENT

          We pass locale and dict as props because Header is a Client Component.
          Client Components cannot call getDictionary() directly (it's server-only).
          So we load the dict here (server) and pass it down.
        */}
        <Header locale={locale} dict={dict} />

        {/*
          MAIN CONTENT

          pt-14 sm:pt-16 = responsive padding-top (56px on mobile, 64px on desktop)
          This offsets the fixed header height so content isn't hidden behind it.

          flex-1 = flex-grow: 1
          This makes main take all available space, pushing footer to bottom.
        */}
        <main className="flex-1 pt-14 sm:pt-16">
          {children}
        </main>

        {/* Footer receives same props as Header */}
        <Footer locale={locale} dict={dict} />
      </body>
    </html>
  );
}
