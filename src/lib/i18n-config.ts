/**
 * I18N CONFIG - src/lib/i18n-config.ts
 * =====================================
 * 
 * This file contains SHARED i18n configuration that can be imported
 * by BOTH Server Components AND Client Components.
 * 
 * WHY A SEPARATE FILE?
 * --------------------
 * The main i18n.ts file uses `import 'server-only'` which makes it
 * impossible to import in Client Components. But Client Components
 * still need:
 * - The `Locale` type for TypeScript
 * - The locales array for language switcher
 * - The `Dictionary` type for props typing
 * 
 * WHAT GOES WHERE:
 * ----------------
 * i18n-config.ts (this file):
 *   ✓ Types (Locale, Dictionary)
 *   ✓ Constants (locales, localeNames, localeFlags)
 *   ✓ Pure functions (hasLocale)
 *   ✗ No server-only imports
 *   ✗ No async dictionary loading
 * 
 * i18n.ts:
 *   ✓ 'server-only' import
 *   ✓ getDictionary() async function
 *   ✓ Re-exports from this file for convenience
 *   ✗ Cannot be imported in Client Components
 * 
 * USAGE:
 * - Server Components: import from '@/lib/i18n' (has everything)
 * - Client Components: import from '@/lib/i18n-config' (types & constants only)
 */

// ============================================================================
// LOCALE CONFIGURATION
// ============================================================================

/**
 * SUPPORTED LOCALES
 * 
 * `as const` makes this a readonly tuple type, not just string[].
 * This allows TypeScript to infer the exact values for the Locale type.
 * 
 * Without `as const`: locales: string[]
 * With `as const`: locales: readonly ['fr', 'en', 'ja']
 */
export const locales = ['fr', 'en', 'ja'] as const;

/**
 * LOCALE TYPE
 * 
 * This extracts the union type from the locales array.
 * Locale = 'fr' | 'en' | 'ja'
 * 
 * typeof locales = readonly ['fr', 'en', 'ja']
 * typeof locales[number] = 'fr' | 'en' | 'ja'
 */
export type Locale = (typeof locales)[number];

/**
 * DEFAULT LOCALE
 * 
 * Used as fallback when:
 * - User's language isn't supported
 * - Cookie/header detection fails
 * - A post isn't translated to the requested language
 */
export const defaultLocale: Locale = 'fr';

/**
 * HUMAN-READABLE LOCALE NAMES
 * 
 * Used in the language switcher tooltip and other UI elements.
 * Record<Locale, string> ensures we have an entry for every locale.
 */
export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ja: '日本語',
};

/**
 * LOCALE FLAGS (Emoji)
 * 
 * Displayed in the language switcher for quick visual identification.
 * Using emoji instead of images keeps the bundle smaller.
 */
export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ja: '🇯🇵',
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * hasLocale - Type Guard
 * ======================
 * 
 * A TYPE GUARD is a function that narrows a type in TypeScript.
 * 
 * The `locale is Locale` return type tells TypeScript:
 * "If this function returns true, treat the input as type Locale"
 * 
 * EXAMPLE:
 * ```ts
 * const locale: string = params.locale;
 * if (hasLocale(locale)) {
 *   // TypeScript now knows locale is 'fr' | 'en' | 'ja', not just string
 *   getDictionary(locale); // ✓ Works!
 * }
 * ```
 * 
 * WHY CAST TO Locale?
 * TypeScript's .includes() doesn't narrow types by default.
 * The `as Locale` cast is safe because we check the array.
 * 
 * @param locale - Any string to check
 * @returns true if locale is a supported locale
 */
export const hasLocale = (locale: string): locale is Locale =>
  locales.includes(locale as Locale);

// ============================================================================
// DICTIONARY TYPE
// ============================================================================

/**
 * DICTIONARY TYPE
 * ===============
 * 
 * This interface defines the structure of our translation JSON files.
 * It ensures type safety when accessing translations.
 * 
 * BENEFITS:
 * - Autocomplete: dict.home.welcome (IDE shows all options)
 * - Type checking: dict.home.welcom → Error! typo detected
 * - Refactoring: Rename a key → TypeScript shows all usages
 * 
 * STRUCTURE MIRRORS JSON:
 * This type MUST match the structure in fr.json, en.json, ja.json.
 * If you add a new translation key, add it here too.
 * 
 * USAGE:
 * ```tsx
 * // In Server Component
 * const dict: Dictionary = await getDictionary('fr');
 * return <h1>{dict.home.welcome}</h1>;
 * 
 * // In Client Component (passed as prop)
 * function MyComponent({ dict }: { dict: Dictionary }) {
 *   return <p>{dict.footer.tagline}</p>;
 * }
 * ```
 */
export interface Dictionary {
  /**
   * Navigation translations
   * Used in: Header.tsx, mobile menu
   */
  nav: {
    posts: string;      // "Journal" / "Journal" / "日記"
    about: string;      // "Qui suis-je" / "About me" / "私について"
    subscribe: string;  // "S'abonner" / "Subscribe" / "購読"
  };

  /**
   * Home page translations
   * Used in: src/app/[locale]/page.tsx
   */
  home: {
    welcome: string;           // "Bienvenue dans mon"
    tagline: string;           // Site description
    browseByCategory: string;  // Category section title
    latestPosts: string;       // Posts section title
    allPosts: string;          // "All entries"
    posts: string;             // Plural form
    post: string;              // Singular form
    noPosts: string;           // Empty state message
    noPostsInCategory: string; // Category empty state
    stayUpdated: string;       // Newsletter title
    stayUpdatedDesc: string;   // Newsletter description
    emailPlaceholder: string;  // Input placeholder
  };

  /**
   * Activity chart translations
   * Used in: ActivityChart.tsx
   */
  activity: {
    writingActivity: string;  // Chart title
    less: string;             // Legend: "Less"
    more: string;             // Legend: "More"
    postsCount: string;       // Plural: "entries"
    postCount: string;        // Singular: "entry"
  };

  /**
   * Individual post page translations
   * Used in: src/app/[locale]/posts/[slug]/page.tsx
   */
  post: {
    backToPosts: string;   // Back button text
    writtenBy: string;     // Author prefix
    viewAllPosts: string;  // Bottom CTA
    minRead: string;       // Reading time suffix
  };

  /**
   * About page translations
   * Used in: src/app/[locale]/about/page.tsx
   */
  about: {
    title: string;      // Page title
    subtitle: string;   // Page subtitle
    aboutMe: string;    // Section title
    techStack: string;  // Section title
    notCoding: string;  // Section title
    journey: string;    // Section title
    connect: string;    // Section title
    thanks: string;     // Thank you message
    readPosts: string;  // CTA button text
  };

  /**
   * Footer translations
   * Used in: Footer.tsx
   */
  footer: {
    tagline: string;  // Site tagline
    rights: string;   // Copyright text
  };

  /**
   * Category translations
   * Used in: PostList.tsx, PostCard.tsx
   * 
   * These MUST match the keys in types.ts CATEGORIES constant.
   */
  categories: {
    all: string;          // "All" filter option
    reflections: string;  // Category name
    experiences: string;  // Category name
    culture: string;      // Category name
    work: string;         // Category name
    tech: string;         // Category name
    daily: string;        // Category name
  };

  /**
   * Filter/search translations
   * Used in: PostList.tsx (date filter banner)
   */
  filter: {
    showingPostsFrom: string;  // "Showing posts from"
    postsFound: string;        // Plural count
    postFound: string;         // Singular count
    clearFilter: string;       // Clear button
    noPostsOnDay: string;      // Empty state
    viewAllPosts: string;      // View all link
  };
}



