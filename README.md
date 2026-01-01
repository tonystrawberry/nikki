# nikki - Digital Diary 📔

A multilingual personal blog/diary built with **Next.js 16**, featuring internationalization (i18n), markdown content management, and a modern UI with shadcn/ui.

## 🎯 Interview Quick Reference

> "Tell me about this project"

This is a **Server-Side Rendered (SSR)** blog using Next.js App Router. It supports **3 languages** (French, English, Japanese), uses **Markdown** for content, and implements the latest Next.js 16 patterns including `proxy.ts` for routing and `server-only` imports for security.

---

## 📚 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Project Structure](#-project-structure)
3. [Key Concepts Explained](#-key-concepts-explained)
4. [How Internationalization Works](#-how-internationalization-works)
5. [Data Flow](#-data-flow)
6. [Server vs Client Components](#-server-vs-client-components)
7. [Styling Architecture](#-styling-architecture)
8. [Common Interview Questions](#-common-interview-questions)

---

## 🛠 Tech Stack

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **Next.js 16** | React framework | SSR, file-based routing, API routes, optimizations |
| **TypeScript** | Type safety | Catch errors at compile time, better DX |
| **Tailwind CSS** | Styling | Utility-first, no CSS files, rapid development |
| **shadcn/ui** | UI components | Accessible, customizable, not a dependency |
| **gray-matter** | Markdown parsing | Extract frontmatter from `.md` files |
| **remark** | Markdown to HTML | Convert markdown content to renderable HTML |
| **date-fns** | Date formatting | Lightweight, tree-shakeable date library |
| **@formatjs/intl-localematcher** | Locale detection | Match browser language to supported locales |
| **negotiator** | HTTP parsing | Parse `Accept-Language` headers |

---

## 📁 Project Structure

```
nikki/
├── src/
│   ├── app/                      # Next.js App Router (pages & layouts)
│   │   ├── layout.tsx            # Root layout (minimal, passes children)
│   │   ├── globals.css           # Global styles & Tailwind imports
│   │   └── [locale]/             # Dynamic route for i18n
│   │       ├── layout.tsx        # Locale layout (Header, Footer, fonts)
│   │       ├── page.tsx          # Home page (/)
│   │       ├── about/
│   │       │   └── page.tsx      # About page (/about)
│   │       └── posts/
│   │           └── [slug]/
│   │               └── page.tsx  # Individual post page (/posts/hello-world)
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── Header.tsx            # Site header (client component)
│   │   ├── Footer.tsx            # Site footer (server component)
│   │   ├── PostCard.tsx          # Blog post preview card
│   │   ├── PostList.tsx          # Posts grid with filtering (client)
│   │   ├── ActivityChart.tsx     # GitHub-style activity chart (client)
│   │   └── LanguageSwitcher.tsx  # Language toggle (client)
│   │
│   ├── lib/                      # Utility functions & business logic
│   │   ├── blog.ts               # Markdown reading & parsing (server-only)
│   │   ├── types.ts              # Shared TypeScript types
│   │   ├── i18n.ts               # i18n with getDictionary (server-only)
│   │   ├── i18n-config.ts        # i18n types & constants (shared)
│   │   └── utils.ts              # General utilities (cn function)
│   │
│   ├── dictionaries/             # Translation JSON files
│   │   ├── fr.json               # French translations
│   │   ├── en.json               # English translations
│   │   └── ja.json               # Japanese translations
│   │
│   └── proxy.ts                  # Request proxy (replaces middleware.ts)
│
├── posts/                        # Markdown blog posts
│   ├── fr/                       # French posts (canonical)
│   ├── en/                       # English posts
│   └── ja/                       # Japanese posts
│
├── public/                       # Static assets (images, favicon)
├── tailwind.config.ts            # Tailwind configuration
├── next.config.ts                # Next.js configuration
└── package.json                  # Dependencies & scripts
```

---

## 🧠 Key Concepts Explained

### 1. App Router vs Pages Router

Next.js has two routing systems:

- **Pages Router** (legacy): Files in `/pages` directory
- **App Router** (current): Files in `/app` directory ✅ We use this

```
App Router Benefits:
├── Server Components by default (better performance)
├── Nested layouts (shared UI between routes)
├── Loading & error states built-in
└── Streaming & Suspense support
```

### 2. File-Based Routing

In Next.js, **the file system IS the router**:

```
src/app/[locale]/page.tsx       →  /fr, /en, /ja
src/app/[locale]/about/page.tsx →  /fr/about, /en/about
src/app/[locale]/posts/[slug]/page.tsx → /fr/posts/hello-world
```

**Special files:**
- `page.tsx` - The UI for a route (required to make route accessible)
- `layout.tsx` - Shared UI wrapper (persists across navigation)
- `loading.tsx` - Loading UI (shown while page loads)
- `error.tsx` - Error UI (catches errors in segment)
- `not-found.tsx` - 404 UI

### 3. Dynamic Routes

Square brackets `[]` create dynamic segments:

```tsx
// src/app/[locale]/posts/[slug]/page.tsx

// URL: /fr/posts/hello-world
// params = { locale: 'fr', slug: 'hello-world' }

export default async function PostPage({ params }) {
  const { locale, slug } = await params;
  // Use locale and slug to fetch the right content
}
```

### 4. Static Generation (SSG) vs Server-Side Rendering (SSR)

```tsx
// STATIC: Generated at BUILD time (faster, cached)
export async function generateStaticParams() {
  return [
    { locale: 'fr', slug: 'hello-world' },
    { locale: 'en', slug: 'hello-world' },
  ];
}

// DYNAMIC: Generated at REQUEST time (always fresh)
export const dynamic = 'force-dynamic';
```

We use `generateStaticParams` for blog posts → Pages are pre-built at deploy time.

---

## 🌍 How Internationalization Works

### Step 1: Request Arrives

```
User visits: https://nikki.com/
           ↓
      proxy.ts intercepts
           ↓
   Checks for locale in URL (/fr, /en, /ja)
           ↓
   No locale? Detect from browser headers
           ↓
   Redirect to /fr (or detected locale)
```

### Step 2: Proxy Detection Logic

```typescript
// src/proxy.ts
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

// Browser sends: Accept-Language: ja,en;q=0.9,fr;q=0.8
// Negotiator parses this into: ['ja', 'en', 'fr']
// match() finds best match from our supported locales
```

### Step 3: Layout Loads Dictionary

```typescript
// src/app/[locale]/layout.tsx
const dict = await getDictionary(locale); // Loads fr.json, en.json, or ja.json
```

### Step 4: Components Use Translations

```tsx
<h1>{dict.home.welcome} nikki</h1>
// French: "Bienvenue dans mon nikki"
// English: "Welcome to my nikki"
// Japanese: "ようこそ、私の nikki"
```

### Why Two i18n Files?

```
i18n-config.ts  →  Types & constants (can be imported ANYWHERE)
i18n.ts         →  getDictionary() with 'server-only' (ONLY server components)
```

This separation exists because:
- Client components CANNOT import server-only modules
- But they still need access to the `Locale` type and constants

---

## 📊 Data Flow

### How a Blog Post Gets Rendered

```
1. User visits /fr/posts/hello-world
           ↓
2. Next.js matches: src/app/[locale]/posts/[slug]/page.tsx
           ↓
3. Server Component executes:
   - params = { locale: 'fr', slug: 'hello-world' }
   - getPostBySlugWithFallback('hello-world', 'fr')
           ↓
4. blog.ts reads: posts/fr/hello-world.md
           ↓
5. gray-matter extracts:
   - frontmatter: { title, date, excerpt, ... }
   - content: markdown string
           ↓
6. remark converts markdown → HTML
           ↓
7. Component renders HTML to client
```

### Markdown File Structure

```markdown
---
title: "Mon titre"          ← Frontmatter (YAML)
date: "2026-01-01"
excerpt: "Description..."
category: "tech"
tags: ["nextjs", "react"]
coverImage: "/images/..."
---

# Contenu                   ← Markdown content
Ceci est mon article...
```

---

## ⚡ Server vs Client Components

### Server Components (Default)

```tsx
// NO "use client" directive = Server Component

// ✅ CAN DO:
// - Read files (fs module)
// - Access database directly
// - Keep secrets safe
// - Reduce bundle size

// ❌ CANNOT DO:
// - Use useState, useEffect
// - Handle click events
// - Use browser APIs
```

### Client Components

```tsx
"use client"; // ← This directive makes it a Client Component

// ✅ CAN DO:
// - Use hooks (useState, useEffect)
// - Handle events (onClick, onChange)
// - Use browser APIs (window, localStorage)

// ❌ CANNOT DO:
// - Import server-only modules
// - Access file system
// - Keep secrets (code is sent to browser!)
```

### Our Component Types

| Component | Type | Why |
|-----------|------|-----|
| `layout.tsx` | Server | Fetches dictionary, no interactivity |
| `page.tsx` | Server | Fetches posts, renders static content |
| `Header.tsx` | Client | Has interactive language switcher |
| `Footer.tsx` | Server | No interactivity needed |
| `PostCard.tsx` | Server | Just displays data |
| `PostList.tsx` | Client | Has category filter state |
| `ActivityChart.tsx` | Client | Has hover state, click handlers |
| `LanguageSwitcher.tsx` | Client | Handles navigation, uses router |

---

## 🎨 Styling Architecture

### Tailwind CSS

```tsx
// Utility classes directly in JSX
<div className="flex items-center gap-4 p-6 bg-card rounded-xl">
```

### CSS Variables (Theme)

```css
/* src/app/globals.css */
:root {
  --background: 0 0% 100%;      /* Light mode */
  --foreground: 0 0% 3.9%;
}

.dark {
  --background: 0 0% 3.9%;      /* Dark mode */
  --foreground: 0 0% 98%;
}
```

### shadcn/ui

NOT a npm package! Components are **copied into your codebase**:

```
src/components/ui/
├── button.tsx      ← You own this code
├── card.tsx        ← Customize freely
├── badge.tsx       ← No dependency updates
└── ...
```

### The `cn()` Utility

```tsx
import { cn } from "@/lib/utils";

// Merges Tailwind classes intelligently
<div className={cn(
  "base-styles",
  isActive && "active-styles",    // Conditional
  className                        // Props override
)} />
```

---

## 💬 Common Interview Questions

### Q: "What is the App Router?"

> The App Router is Next.js's modern routing system (introduced in v13). It uses the `app/` directory and provides Server Components by default, nested layouts, and better data fetching patterns. Unlike the Pages Router, layouts persist across navigations and components can be async.

### Q: "What's the difference between Server and Client Components?"

> Server Components run only on the server - they can access the filesystem, databases, and keep secrets safe. They send HTML to the client, reducing JavaScript bundle size. Client Components (marked with `"use client"`) run in the browser and can use React hooks and handle user interactions.

### Q: "How does file-based routing work?"

> In Next.js, the file structure in `app/` directly maps to URL routes. A file at `app/about/page.tsx` becomes the `/about` route. Dynamic segments use brackets: `app/posts/[slug]/page.tsx` matches `/posts/any-slug`.

### Q: "What is `generateStaticParams`?"

> It's a function that tells Next.js which dynamic routes to pre-render at build time. For a blog, you'd return all post slugs so the pages are static HTML, making them faster and cacheable.

### Q: "How do you handle i18n in Next.js?"

> We use dynamic route segments `[locale]` combined with a proxy that detects the user's preferred language from browser headers. Translation dictionaries are loaded server-side and passed to components. The `proxy.ts` file handles redirecting users to their preferred locale.

### Q: "What is `proxy.ts`?"

> It's Next.js 16's replacement for `middleware.ts`. It intercepts requests before they reach your pages, allowing you to redirect, rewrite URLs, or modify headers. We use it to detect the user's language and redirect to the correct locale.

### Q: "Why separate `i18n.ts` and `i18n-config.ts`?"

> `i18n.ts` uses `import 'server-only'` which prevents it from being imported in Client Components (security feature). But Client Components still need access to types like `Locale`. So we put shared types in `i18n-config.ts` which can be imported anywhere.

### Q: "What is gray-matter?"

> It's a library that parses the frontmatter (YAML metadata between `---`) from markdown files. It extracts structured data (title, date, tags) separately from the content, making it easy to build blog systems.

### Q: "How does the Activity Chart work?"

> It's a Client Component that receives all posts as props. It builds a Map of dates to post counts, then renders a grid of weeks/days. Each cell's color intensity reflects the number of posts on that day. Click handlers filter the post list by date.

### Q: "What are the benefits of using Tailwind?"

> Tailwind provides utility classes that you compose directly in JSX, eliminating context switching between files. It's highly customizable via `tailwind.config.ts`, produces tiny production builds through purging unused classes, and makes responsive design easy with breakpoint prefixes.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev -- -p 3050

# Build for production
npm run build

# Start production server
npm start
```

## 📝 Adding a New Blog Post

1. Create a markdown file in `posts/fr/` (French is required)
2. Add frontmatter with required fields
3. Optionally add translations in `posts/en/` and `posts/ja/`

```markdown
---
title: "Your Title"
date: "2026-01-15"
excerpt: "Short description"
author: "Your Name"
category: "tech"  # reflections | experiences | culture | work | tech | daily
tags: ["tag1", "tag2"]
coverImage: "https://..."
---

Your content here...
```

---

## 📖 Further Reading

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

---

Built with ❤️ using Next.js 16
