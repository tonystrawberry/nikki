/**
 * HOME PAGE - src/app/[locale]/page.tsx
 * ======================================
 *
 * The main landing page of the blog.
 * This is a SERVER COMPONENT - it fetches data and renders HTML on the server.
 *
 * FILE NAMING IN NEXT.JS:
 * -----------------------
 * - page.tsx = The UI for this route (makes the route accessible)
 * - layout.tsx = Wrapper that persists across child routes
 * - loading.tsx = Loading UI (shown during navigation)
 * - error.tsx = Error boundary
 * - not-found.tsx = 404 page
 *
 * ROUTE MATCHING:
 * ---------------
 * This file is at: src/app/[locale]/page.tsx
 * It matches routes:
 * - /fr (locale = 'fr')
 * - /en (locale = 'en')
 * - /ja (locale = 'ja')
 *
 * SERVER COMPONENTS:
 * ------------------
 * By default, all components in the app directory are Server Components.
 * Benefits:
 * - Direct database/file access
 * - Smaller client bundles (code stays on server)
 * - Better SEO (full HTML sent to browser)
 * - Secure (secrets never reach client)
 *
 * async/await:
 * Server Components can be async functions!
 * This allows top-level await for data fetching.
 *
 * @see https://nextjs.org/docs/app/building-your-application/rendering/server-components
 */

import { notFound } from "next/navigation";

// These functions read from the file system - SERVER ONLY
// They CANNOT be imported in Client Components
import {
  getAllPosts,
  getAllPostsAcrossLocales,
  getPostCanonicalLocaleMap,
  getAllCollectionSlugs,
  getCollectionInfo,
  getAllCategories,
  getAllTags,
} from "@/lib/blog";

// Client Component - will be hydrated on the browser
import { PostList } from "@/components/PostList";

// i18n utilities - server-only (has 'import server-only')
import { hasLocale, getDictionary } from "@/lib/i18n";

// ============================================================================
// TYPES
// ============================================================================

/**
 * PAGE PROPS
 *
 * In Next.js 15+, params is a Promise.
 * This enables better streaming and concurrent rendering.
 *
 * The params object contains dynamic route segments:
 * - For /fr → params.locale = 'fr'
 * - For /en → params.locale = 'en'
 */
interface PageProps {
  params: Promise<{ locale: string }>;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * Home Page Component
 *
 * This is an ASYNC Server Component.
 * It runs entirely on the server and sends HTML to the client.
 *
 * EXECUTION FLOW:
 * 1. User navigates to /fr
 * 2. Next.js calls this function on the server
 * 3. We await params to get { locale: 'fr' }
 * 4. We fetch data using server-side functions
 * 5. We render JSX to HTML
 * 6. HTML is sent to browser (no JavaScript needed for this component!)
 * 7. Client Components (PostList) hydrate and become interactive
 *
 * @param params - Contains the locale from the URL
 */
export default async function Home({ params }: PageProps) {
  /**
   * AWAIT PARAMS
   *
   * In Next.js 15+, params are async to support streaming.
   * We must await them before using.
   */
  const { locale } = await params;

  /**
   * VALIDATE LOCALE
   *
   * hasLocale() checks if the locale is valid ('fr' | 'en' | 'ja').
   * If someone visits /xyz, we show 404.
   *
   * notFound() throws a special error that Next.js catches
   * and renders the not-found.tsx page instead.
   */
  if (!hasLocale(locale)) {
    notFound();
  }

  /**
   * FETCH DATA (Server-Side)
   *
   * These functions read markdown files from disk.
   * They can ONLY run on the server (they use Node.js 'fs' module).
   *
   * posts: Posts in the current locale (for the post list)
   * allPosts: All posts across locales (for the activity chart)
   *
   * Why two separate lists?
   * - Activity chart should show ALL writing activity regardless of language
   * - Post list should only show posts available in current language
   *   (with fallback indicators for untranslated posts)
   */
  const posts = getAllPosts(locale);
  const allPosts = getAllPostsAcrossLocales();
  const postCanonicalLocales = getPostCanonicalLocaleMap();

  // Collections, categories, and tags power the embedded Collections / Search tabs.
  const collections = getAllCollectionSlugs(locale).map((slug) => {
    const { title, posts: collectionPosts } = getCollectionInfo(slug, locale);
    return { slug, title, postCount: collectionPosts.length };
  });
  const categories = getAllCategories();
  const tags = getAllTags(locale);

  /**
   * LOAD TRANSLATIONS
   *
   * getDictionary() dynamically imports the correct JSON file.
   * This is server-side only - the JSON never goes to the client as JS.
   * Only the rendered text is sent.
   */
  const dict = await getDictionary(locale);

  /**
   * RENDER JSX
   *
   * This JSX is converted to HTML on the server.
   * Static parts (hero, newsletter) are pure HTML.
   *
   * PostList is a Client Component - it will:
   * 1. Receive props as serialized JSON
   * 2. Hydrate on the client (attach event handlers)
   * 3. Become interactive
   */
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-16">
      {/*
        HERO SECTION

        This is 100% server-rendered HTML.
        No JavaScript needed for this section.

        CSS Classes:
        - mx-auto: center horizontally
        - max-w-4xl: max width ~896px
        - px-4 sm:px-6: responsive horizontal padding
        - py-8 sm:py-16: responsive vertical padding
        - mb-10 sm:mb-16: responsive margin bottom
        - opacity-0 animate-fade-in-up: entrance animation
      */}
      <section className="mb-10 sm:mb-16 opacity-0 animate-fade-in-up">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
          {/*
            TRANSLATION USAGE

            dict.home.welcome = "Bienvenue dans mon" (FR)
                              = "Welcome to my" (EN)
                              = "ようこそ、私の" (JA)
          */}
          {dict.home.welcome}{" "}
          <span className="text-gradient">nikki</span>
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          {dict.home.tagline}
        </p>
      </section>

      {/*
        POST LIST (Client Component)

        This is where Server and Client Components meet.

        DATA PASSING:
        - posts: Serialized to JSON, sent to client
        - allPostsForChart: Serialized to JSON, sent to client
        - locale: String, sent to client
        - dict: The whole dictionary object, serialized to JSON

        On the client:
        - PostList hydrates (JavaScript attaches to HTML)
        - Event handlers become active
        - State (useState) starts working

        IMPORTANT: Only serializable data can be passed!
        - ✓ Strings, numbers, booleans
        - ✓ Arrays and plain objects
        - ✓ null
        - ✗ Functions
        - ✗ Classes
        - ✗ Dates (pass as ISO string instead)
      */}
      <PostList
        posts={posts}
        allPostsForChart={allPosts}
        postCanonicalLocales={postCanonicalLocales}
        collections={collections}
        categories={categories}
        tags={tags}
        locale={locale}
        dict={dict}
      />

      {/*
        NEWSLETTER SECTION

        Powered by Buttondown - a simple newsletter service.
        Form submits directly to Buttondown's API.

        animation-delay-500: Staggered entrance animation
      */}
      <section className="mt-12 sm:mt-20 p-5 sm:p-8 rounded-xl sm:rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm opacity-0 animate-fade-in-up animation-delay-500">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">{dict.home.stayUpdated}</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            {dict.home.stayUpdatedDesc}
          </p>
          <form
            action="https://buttondown.email/api/emails/embed-subscribe/tonystrawberry"
            method="post"
            target="_blank"
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              name="email"
              required
              placeholder={dict.home.emailPlaceholder}
              className="flex-1 px-4 py-2.5 sm:py-2 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-base"
            />
            <button
              type="submit"
              className="px-6 py-2.5 sm:py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              {dict.nav.subscribe}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
