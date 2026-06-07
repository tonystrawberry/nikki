/**
 * SHARED TYPES - src/lib/types.ts
 * ================================
 *
 * This file contains TypeScript types and constants that are shared
 * between Server and Client Components.
 *
 * WHY A SEPARATE TYPES FILE?
 * --------------------------
 * 1. blog.ts uses Node.js `fs` module → can't be imported in Client Components
 * 2. But Client Components need the PostMeta type for props
 * 3. Solution: Extract shared types to a file with no server dependencies
 *
 * WHAT GOES HERE:
 * ✓ Types (interfaces, type aliases)
 * ✓ Constants (CATEGORIES)
 * ✓ Pure type-level code
 * ✗ No `fs`, `path`, or other Node.js modules
 * ✗ No 'server-only' imports
 *
 * IMPORTING:
 * - Server Components: import from '@/lib/types' or '@/lib/blog'
 * - Client Components: import from '@/lib/types' ONLY
 */

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * CATEGORIES CONSTANT
 * ===================
 *
 * Defines all available post categories with their metadata.
 * This is used for:
 * - Category filter buttons (PostList.tsx)
 * - Category badges on post cards (PostCard.tsx)
 * - Validation when reading posts (blog.ts)
 *
 * `as const` EXPLANATION:
 * ----------------------
 * Without `as const`, TypeScript infers:
 *   { reflections: { name: string, icon: string, description: string } }
 *
 * With `as const`, TypeScript infers the EXACT values:
 *   { readonly reflections: { readonly name: "Reflections", ... } }
 *
 * This enables:
 * 1. Type-safe category keys: Category = 'reflections' | 'experiences' | ...
 * 2. Autocomplete for category properties
 * 3. Compile-time errors for typos
 */
export const CATEGORIES = {
  note: {
    name: 'Note',
    icon: '📝',
    description: 'Notes and thoughts about articles, videos, books, etc.'
  },
  work: {
    name: 'Work',
    icon: '💼',
    description: 'Career, projects, and professional life'
  },
  tech: {
    name: 'Tech',
    icon: '💻',
    description: 'Technology, coding, and digital tools'
  },
  daily: {
    name: 'Daily',
    icon: '📝',
    description: 'Everyday life and random thoughts'
  },
  reflections: {
    name: 'Reflections',
    icon: '💭',
    description: 'Philosophy, life, mindset, and personal reflections'
  },
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * CATEGORY TYPE
 * =============
 *
 * Extracts the keys of CATEGORIES as a union type.
 *
 * keyof typeof CATEGORIES = 'note' | 'work' | 'tech' | 'daily'
 *
 * USAGE:
 * ```tsx
 * const category: Category = 'tech'; // ✓ Valid
 * const category: Category = 'invalid'; // ✗ Error!
 * ```
 */
export type Category = keyof typeof CATEGORIES;

/**
 * POST METADATA INTERFACE
 * =======================
 *
 * Contains all post information EXCEPT the full content.
 * Used for listing pages where we show post previews.
 *
 * WHY SEPARATE FROM POST?
 * - Listing pages don't need full content (performance)
 * - Content requires async markdown processing (slower)
 * - PostMeta is synchronous to create
 *
 * FIELDS COME FROM:
 * - Frontmatter: title, date, excerpt, author, category, tags, coverImage
 * - Calculated: slug (from filename), readingTime (from content length)
 */
export interface PostMeta {
  /** URL-safe identifier, derived from filename (e.g., 'hello-world') */
  slug: string;

  /** Post title from frontmatter */
  title: string;

  /** Publication date in ISO format (YYYY-MM-DD) */
  date: string;

  /** Short description for previews and SEO */
  excerpt: string;

  /** Author name */
  author: string;

  /**
   * Primary post category — kept for backwards-compatibility.
   * Always equals `categories[0]`.
   */
  category: Category;

  /**
   * All categories for this post (at least one).
   * Derived from the frontmatter `categories` array, falling back to
   * `[category]` for legacy posts. A post can belong to several categories
   * (e.g. both "note" and "tech").
   */
  categories: Category[];

  /** Array of tags for filtering/searching */
  tags: string[];

  /** Optional cover image URL */
  coverImage?: string;

  /** Optional YouTube video URL */
  youtubeUrl?: string;

  /** Optional collection slug (e.g. "ddia") – groups posts into a book/story */
  collection?: string;

  /** Optional order within the collection (e.g. chapter number) */
  collectionOrder?: number;

  /** Optional display title for the collection (e.g. "Designing Data-Intensive Applications") – typically set on one post */
  collectionTitle?: string;

  /** Estimated reading time in minutes (as string, e.g., "5") */
  readingTime: string;
}

/**
 * FULL POST INTERFACE
 * ===================
 *
 * Extends PostMeta with the full HTML content.
 * Used on individual post pages.
 *
 * `extends PostMeta` means Post has ALL PostMeta fields PLUS content.
 *
 * The content field is HTML (not markdown) because:
 * - remark already processed it
 * - Ready to render with dangerouslySetInnerHTML
 */
export interface Post extends PostMeta {
  /** Full post content as HTML string */
  content: string;
}
