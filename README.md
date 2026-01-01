# sekai — A Next.js Blog

A beautiful, minimal blog built with Next.js 15, gray-matter, and shadcn/ui components.

## Features

- ✨ **Modern Stack** — Next.js 15 with App Router and React Server Components
- 📝 **Markdown Support** — Write posts in Markdown with frontmatter via gray-matter
- 🎨 **Beautiful Design** — Custom warm dark theme with amber accents
- 🧩 **shadcn/ui Components** — Accessible, customizable UI components
- ⚡ **Static Generation** — Posts are pre-rendered at build time for maximum performance
- 📱 **Responsive** — Looks great on all devices
- 🎭 **Smooth Animations** — Staggered page load animations

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Writing Posts

Create Markdown files in the `posts/` directory with frontmatter:

```markdown
---
title: "Your Post Title"
date: "2026-01-01"
excerpt: "A brief description of your post"
author: "Your Name"
tags: ["tag1", "tag2"]
coverImage: "https://example.com/image.jpg"
---

Your content here...
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | The post title |
| `date` | Yes | Publication date (YYYY-MM-DD) |
| `excerpt` | Yes | Short description for previews |
| `author` | No | Author name (defaults to "Anonymous") |
| `tags` | No | Array of tags for categorization |
| `coverImage` | No | URL for the cover image |

## Project Structure

```
├── posts/                 # Markdown blog posts
├── src/
│   ├── app/
│   │   ├── page.tsx       # Home page with post list
│   │   ├── about/         # About page
│   │   └── posts/[slug]/  # Dynamic post pages
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── Header.tsx     # Site header
│   │   ├── Footer.tsx     # Site footer
│   │   └── PostCard.tsx   # Blog post card
│   └── lib/
│       ├── blog.ts        # Blog utilities (frontmatter parsing)
│       └── utils.ts       # General utilities
```

## Customization

### Theme

Edit `src/app/globals.css` to customize colors. The theme uses OKLCH color space for better color manipulation:

```css
:root {
  --primary: oklch(0.78 0.15 65); /* Warm amber */
  --accent: oklch(0.70 0.12 45);  /* Burnt orange */
  /* ... other variables */
}
```

### Fonts

The blog uses three custom fonts:
- **Outfit** — Sans-serif for headings and UI
- **Crimson Pro** — Serif for article body text
- **JetBrains Mono** — Monospace for code

## Building for Production

```bash
# Build the site
npm run build

# Preview the production build
npm start
```

## Deployment

This blog is optimized for deployment on [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the project in Vercel
3. Deploy!

## License

MIT License — feel free to use this as a starting point for your own blog.
