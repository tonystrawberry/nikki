/**
 * ROOT LAYOUT - src/app/layout.tsx
 * =================================
 * 
 * This is the TOP-LEVEL layout in Next.js App Router.
 * Every page in the application is wrapped by this layout.
 * 
 * WHY IS IT SO MINIMAL?
 * ---------------------
 * In our i18n setup, we handle most layout logic in [locale]/layout.tsx.
 * This root layout just:
 * 1. Imports global CSS (required - Tailwind and custom styles)
 * 2. Passes children through without modification
 * 
 * The actual <html> and <body> tags are in [locale]/layout.tsx because
 * they need access to the locale for the `lang` attribute.
 * 
 * NEXT.JS LAYOUT RULES:
 * - Root layout MUST exist (Next.js requires it)
 * - Root layout MUST define <html> and <body> OR pass to child layout
 * - Layouts persist across page navigations (don't re-render)
 * - Layouts can be nested (root → locale → page-specific)
 * 
 * FILE NAMING:
 * - layout.tsx = Layout component (wraps children)
 * - page.tsx = Page component (renders at that route)
 * - loading.tsx = Loading UI (shown during navigation)
 * - error.tsx = Error boundary (catches errors in segment)
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates
 */

// Import global styles - this line makes Tailwind CSS available everywhere
// Without this import, no Tailwind classes would work in the app
import "./globals.css";

/**
 * Root Layout Component
 * 
 * This is a SERVER COMPONENT by default (no "use client" directive).
 * Server Components:
 * - Run only on the server
 * - Can be async
 * - Don't add to client JavaScript bundle
 * - Cannot use hooks or browser APIs
 * 
 * @param children - The page content or nested layout to render
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We simply return children because [locale]/layout.tsx handles
  // the <html> and <body> tags with the correct locale
  return children;
}
