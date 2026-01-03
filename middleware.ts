import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Import from i18n-config (NOT i18n) because middleware runs on Edge runtime
// and i18n.ts has 'server-only' which isn't compatible with Edge
import { locales, defaultLocale, type Locale } from '@/lib/i18n-config';

function getLocaleFromHeaders(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return defaultLocale;

  // Parse accept-language header
  const preferredLocales = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q = '1'] = lang.trim().split(';q=');
      return { locale: locale.split('-')[0], quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first matching locale
  for (const { locale } of preferredLocales) {
    if (locales.includes(locale as Locale)) {
      return locale as Locale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Skip for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next();
  }

  // Get locale from cookie or headers
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = cookieLocale && locales.includes(cookieLocale)
    ? cookieLocale
    : getLocaleFromHeaders(request);

  // Redirect to localized path
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  newUrl.search = request.nextUrl.search;

  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc.)
    '/((?!_next|api|favicon.ico).*)',
  ],
};
