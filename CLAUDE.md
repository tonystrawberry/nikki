# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

Before committing, validate with:

```bash
npm run lint && npm run build
```

TypeScript type errors surface during `npm run build` (Next.js runs `tsc` as part of the build). There is no separate `tsc` script.

The root `/` redirects to `/fr` (French is the default locale).

## Architecture

**Next.js 16 App Router** with TypeScript, Tailwind CSS v4, and shadcn/ui components.

### Internationalization

Three supported locales: `fr` (default), `en`, `ja`. All routes are prefixed with `[locale]`:
- Locale detection uses `negotiator` + `@formatjs/intl-localematcher` on the Accept-Language header
- Translations live in `src/dictionaries/{locale}.json`
- Locale config and types are in `src/lib/i18n-config.ts`

### Content

Blog posts are markdown files at `posts/{locale}/{YYYY-MM-DD}/{slug}.md` with YAML frontmatter:

```yaml
---
title: "Post Title"
date: "YYYY-MM-DD"
excerpt: "Short preview"
author: "Tony Duong"
category: reflections|experiences|culture|work|tech|daily
tags: [tag1, tag2]
coverImage: "URL"  # optional
---
```

Posts are parsed server-side in `src/lib/blog.ts` using `gray-matter` (frontmatter) and `remark` (markdown → HTML). The rendered HTML is injected via `dangerouslySetInnerHTML`.

**Keystatic CMS** is available at `/keystatic` for managing posts through a UI. Collections: `posts_fr`, `posts_en`, `posts_ja`.

### Server vs Client Components

- **Server**: layouts, pages, post rendering (file I/O)
- **Client** (`"use client"`): `Header`, `PostList`, `ActivityChart`, `LanguageSwitcher` (need interactivity)

### Post Linking / Canonical Locales

Posts can link across locales. `src/lib/blog.ts` handles fallback logic — if a post doesn't exist in the requested locale, it falls back to `en` then `fr`.

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).
