/**
 * PROXY - src/proxy.ts
 * ====================
 * 
 * This file intercepts ALL incoming requests before they reach your pages.
 * It's Next.js 16's replacement for middleware.ts (which is now deprecated).
 * 
 * WHAT IS A PROXY?
 * ----------------
 * A proxy sits between the client and your app, allowing you to:
 * - Redirect users (e.g., / → /fr)
 * - Rewrite URLs (change the URL internally without redirect)
 * - Add/modify headers
 * - Block requests
 * - Implement authentication
 * 
 * USE CASES:
 * - Internationalization (detect language, redirect to locale)
 * - Authentication (check session, redirect to login)
 * - A/B testing (route to different versions)
 * - Feature flags
 * - Geolocation-based routing
 * 
 * HOW IT WORKS:
 * 1. Request comes in (e.g., GET /)
 * 2. proxy() function runs BEFORE any page code
 * 3. We can return NextResponse.redirect() or NextResponse.next()
 * 4. If next(), request continues to the matched page
 * 
 * PERFORMANCE NOTE:
 * Proxy runs on EVERY request matching the config.matcher pattern.
 * Keep it fast - avoid heavy computations or database calls.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @formatjs/intl-localematcher
 * 
 * This library implements the Unicode CLDR locale matching algorithm.
 * It finds the best match between user's preferred languages and our supported locales.
 * 
 * Example:
 * - User prefers: ['de-DE', 'en-US', 'fr']
 * - We support: ['fr', 'en', 'ja']
 * - Result: 'en' (best match from our supported list)
 */
import { match } from '@formatjs/intl-localematcher';

/**
 * Negotiator
 * 
 * Parses the HTTP Accept-Language header into a sorted list of languages.
 * 
 * Browser sends: Accept-Language: en-US,en;q=0.9,fr;q=0.8
 * Negotiator parses to: ['en-US', 'en', 'fr'] (sorted by quality)
 * 
 * The "q" value (quality) indicates preference:
 * - q=1.0 (default) = highest preference
 * - q=0.9 = 90% preference
 * - q=0 = not acceptable
 */
import Negotiator from 'negotiator';

// Our supported locales - must match i18n-config.ts
const locales = ['fr', 'en', 'ja'];

// Default/fallback locale when no match is found
const defaultLocale = 'fr';

/**
 * getLocale - Detect user's preferred locale
 * ==========================================
 * 
 * Priority order:
 * 1. Cookie (user's explicit choice from language switcher)
 * 2. Accept-Language header (browser's language settings)
 * 3. Default locale (fallback)
 * 
 * @param request - The incoming Next.js request object
 * @returns The best locale to use for this user
 */
function getLocale(request: NextRequest): string {
  /**
   * CHECK COOKIE FIRST
   * 
   * If user clicked the language switcher, we stored their choice
   * in a cookie called NEXT_LOCALE. This should override browser settings.
   */
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  /**
   * PARSE ACCEPT-LANGUAGE HEADER
   * 
   * The Accept-Language header is sent by browsers automatically.
   * It contains the user's language preferences from their OS/browser settings.
   * 
   * Example header: "ja,en-US;q=0.9,en;q=0.8,fr;q=0.7"
   * This means: Japanese preferred, then American English, then English, then French
   */
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return defaultLocale;

  // Negotiator needs a headers object (not a Headers instance)
  const headers = { 'accept-language': acceptLanguage };
  
  // Parse the header into an array of language codes
  // Returns: ['ja', 'en-US', 'en', 'fr'] (sorted by preference)
  const languages = new Negotiator({ headers }).languages();
  
  /**
   * MATCH TO OUR SUPPORTED LOCALES
   * 
   * The match() function finds the best match:
   * - User wants: ['ja', 'en-US', 'en', 'fr']
   * - We support: ['fr', 'en', 'ja']
   * - Returns: 'ja' (first user preference that we support)
   * 
   * It also handles regional variants:
   * - User wants 'en-US', we support 'en' → matches 'en'
   * - User wants 'zh-TW', we support 'zh-CN' → might match or fallback
   */
  try {
    return match(languages, locales, defaultLocale);
  } catch {
    // match() can throw if languages array is empty or invalid
    return defaultLocale;
  }
}

/**
 * proxy - Main request handler
 * ============================
 * 
 * This function is called for EVERY request that matches config.matcher.
 * 
 * IMPORTANT: This must be named `proxy` (not `middleware`) for Next.js 16+.
 * 
 * @param request - The incoming request with URL, headers, cookies, etc.
 * @returns NextResponse - either redirect, rewrite, or continue
 */
export function proxy(request: NextRequest) {
  // Extract the pathname from the URL
  // Example: https://nikki.com/fr/about → pathname = '/fr/about'
  const { pathname } = request.nextUrl;

  /**
   * CHECK IF LOCALE ALREADY IN URL
   * 
   * We check if the URL already starts with a valid locale:
   * - /fr/about → has locale ✓
   * - /en → has locale ✓
   * - /about → no locale ✗
   * - / → no locale ✗
   */
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If locale already present, let the request continue normally
  if (pathnameHasLocale) return NextResponse.next();

  /**
   * SKIP STATIC FILES AND API ROUTES
   * 
   * We don't want to add locales to:
   * - /_next/* (Next.js internal files, JS bundles, etc.)
   * - /api/* (API routes)
   * - Files with extensions (favicon.ico, images, etc.)
   * 
   * The includes('.') check catches files like:
   * - /favicon.ico
   * - /images/photo.jpg
   * - /robots.txt
   */
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  /**
   * DETECT LOCALE AND REDIRECT
   * 
   * At this point, we have a page request without a locale.
   * We need to:
   * 1. Detect the user's preferred locale
   * 2. Redirect them to the localized URL
   */
  const locale = getLocale(request);

  /**
   * BUILD THE NEW URL
   * 
   * Original: /about
   * New: /fr/about (if French detected)
   * 
   * We preserve the query string too:
   * Original: /search?q=hello
   * New: /fr/search?q=hello
   */
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  newUrl.search = request.nextUrl.search; // Preserve query params
  
  /**
   * REDIRECT TO LOCALIZED URL
   * 
   * NextResponse.redirect() sends a 307 redirect by default.
   * The browser will make a new request to the localized URL.
   * 
   * 307 = Temporary Redirect (preserves HTTP method)
   * 308 = Permanent Redirect (for SEO, cacheable)
   */
  return NextResponse.redirect(newUrl);
}

/**
 * CONFIG - Matcher pattern
 * ========================
 * 
 * The `matcher` tells Next.js which routes should run through the proxy.
 * This is a REGEX pattern.
 * 
 * Pattern breakdown: '/((?!_next|api|favicon.ico).*)'
 * 
 * - / = starts with /
 * - (?!...) = negative lookahead (DON'T match these)
 * - _next = Next.js internal routes
 * - api = API routes
 * - favicon.ico = favicon file
 * - .* = match everything else
 * 
 * WHY USE A MATCHER?
 * Running proxy on every request would be slow.
 * The matcher filters requests at a lower level (faster).
 * 
 * ALTERNATIVE MATCHERS:
 * - matcher: '/about/:path*' → only /about and its children
 * - matcher: ['/', '/about', '/posts/:path*'] → specific routes
 * - matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'] → exclude more
 */
export const config = {
  matcher: [
    // Match all paths EXCEPT:
    // - _next (internal Next.js files)
    // - api (API routes)
    // - favicon.ico (browser icon)
    '/((?!_next|api|favicon.ico).*)',
  ],
};
