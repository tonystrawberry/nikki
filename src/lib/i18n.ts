/**
 * I18N (Server-Only) - src/lib/i18n.ts
 * =====================================
 * 
 * This file contains the SERVER-ONLY i18n functionality.
 * The main feature is getDictionary() which dynamically loads translations.
 * 
 * WHY 'server-only'?
 * ------------------
 * The `import 'server-only'` directive PREVENTS this file from being
 * imported in Client Components. If you try, you'll get a build error.
 * 
 * This is IMPORTANT because:
 * 1. Translation files shouldn't be in the client bundle (wastes bandwidth)
 * 2. Dynamic imports on the server are more efficient
 * 3. It's a clear separation of concerns
 * 
 * WHAT HAPPENS IF CLIENT IMPORTS THIS?
 * Build error: "server-only" module imported in Client Component
 * 
 * SOLUTION FOR CLIENT COMPONENTS:
 * - Import types/constants from '@/lib/i18n-config' instead
 * - Pass the dictionary as a prop from a Server Component parent
 * 
 * @see https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
 */

// This import PREVENTS this file from being used in Client Components
// It's a "poison pill" that causes a build error if bundled for the client
import 'server-only';

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

/**
 * RE-EXPORT SHARED CONFIG
 * 
 * Server Components can import everything from this single file.
 * This saves having to import from both i18n.ts and i18n-config.ts.
 * 
 * Example Server Component:
 * ```tsx
 * import { getDictionary, locales, hasLocale, type Locale } from '@/lib/i18n';
 * ```
 */
export {
  locales,
  type Locale,
  defaultLocale,
  localeNames,
  localeFlags,
  hasLocale,
  type Dictionary,
} from './i18n-config';

// Import types for use in this file
import type { Locale, Dictionary } from './i18n-config';

// ============================================================================
// DICTIONARY LOADING
// ============================================================================

/**
 * DICTIONARY LOADERS
 * ==================
 * 
 * This object maps each locale to a function that loads its translations.
 * 
 * WHY DYNAMIC IMPORTS?
 * --------------------
 * Using dynamic `import()` instead of static `import` has benefits:
 * 
 * 1. CODE SPLITTING: Each JSON file is a separate chunk
 *    - Only the needed language is loaded
 *    - Other languages aren't downloaded
 * 
 * 2. LAZY LOADING: Files are loaded on-demand
 *    - First request for /fr loads fr.json
 *    - fr.json is cached for subsequent requests
 * 
 * 3. SMALLER BUNDLES: Translations aren't in the main bundle
 * 
 * STATIC vs DYNAMIC IMPORTS:
 * ```ts
 * // STATIC - ALL files bundled together, loaded immediately
 * import frDict from '@/dictionaries/fr.json';
 * import enDict from '@/dictionaries/en.json';
 * import jaDict from '@/dictionaries/ja.json';
 * 
 * // DYNAMIC - Each file is separate, loaded on-demand
 * const frDict = await import('@/dictionaries/fr.json');
 * ```
 * 
 * WHY .then(module => module.default)?
 * ------------------------------------
 * When you dynamically import a JSON file:
 * - The module object has a `default` property containing the JSON
 * - We extract it with `.then(module => module.default)`
 * 
 * The `as Dictionary` cast tells TypeScript the shape of the JSON.
 */
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  // Each key is a locale, each value is a loader function
  fr: () => import('@/dictionaries/fr.json').then((module) => module.default as Dictionary),
  en: () => import('@/dictionaries/en.json').then((module) => module.default as Dictionary),
  ja: () => import('@/dictionaries/ja.json').then((module) => module.default as Dictionary),
};

/**
 * getDictionary - Load translations for a locale
 * ===============================================
 * 
 * This is the main function for loading translations.
 * It's ASYNC because it uses dynamic imports.
 * 
 * USAGE IN SERVER COMPONENTS:
 * ```tsx
 * // src/app/[locale]/page.tsx
 * export default async function Page({ params }) {
 *   const { locale } = await params;
 *   const dict = await getDictionary(locale);
 *   
 *   return <h1>{dict.home.welcome}</h1>;
 * }
 * ```
 * 
 * USAGE WITH CLIENT COMPONENTS:
 * ```tsx
 * // Server Component loads dict, passes to Client Component
 * export default async function Page({ params }) {
 *   const dict = await getDictionary(locale);
 *   return <ClientComponent dict={dict} />;
 * }
 * 
 * // Client Component receives dict as prop
 * "use client";
 * function ClientComponent({ dict }: { dict: Dictionary }) {
 *   return <button>{dict.nav.subscribe}</button>;
 * }
 * ```
 * 
 * CACHING:
 * Next.js automatically caches the result of dynamic imports.
 * The first call loads the file, subsequent calls use the cache.
 * 
 * @param locale - The locale to load ('fr' | 'en' | 'ja')
 * @returns Promise<Dictionary> - The translation object
 */
export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  // Get the loader function for this locale and execute it
  // This triggers the dynamic import and returns the JSON content
  return dictionaries[locale]();
};
