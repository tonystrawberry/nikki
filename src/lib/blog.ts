/**
 * BLOG UTILITIES - src/lib/blog.ts
 * =================================
 *
 * This file contains all the logic for reading and processing blog posts.
 * It uses Node.js file system APIs, so it can ONLY run on the server.
 *
 * KEY RESPONSIBILITIES:
 * 1. Read markdown files from the posts/ directory
 * 2. Parse frontmatter (YAML metadata) using gray-matter
 * 3. Convert markdown to HTML using remark
 * 4. Provide functions to query posts (by slug, category, tag, etc.)
 *
 * FILE STRUCTURE (date-based folders):
 * ```
 * posts/
 * ├── fr/                          ← French posts (canonical/required)
 * │   ├── 2026-01-01/
 * │   │   └── hello-world.md
 * │   └── 2026-01-02/
 * │       └── my-post.md
 * ├── en/                          ← English translations
 * │   ├── 2026-01-01/
 * │   │   └── hello-world.md
 * │   └── 2026-01-02/
 * │       └── my-post.md
 * └── ja/                          ← Japanese translations
 *     └── 2026-01-01/
 *         └── hello-world.md
 * ```
 *
 * IMAGES: Store in public/images/posts/{date}/ and reference as /images/posts/{date}/image.png
 * ```
 *
 * WHY NODE.JS APIs HERE?
 * ---------------------
 * This file uses `fs` (file system) and `path` modules from Node.js.
 * These ONLY exist on the server, not in browsers.
 *
 * Client Components CANNOT import this file because:
 * 1. `fs` doesn't exist in browsers → build error
 * 2. Posts are on the server's file system, not the client's
 *
 * SOLUTION: Server Components call these functions, then pass
 * the data as props to Client Components.
 *
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching
 */

// Node.js file system module - for reading files
// This import FAILS in Client Components (fs doesn't exist in browsers)
import fs from 'fs';

// Node.js path module - for building file paths safely across OS
import path from 'path';

/**
 * gray-matter
 *
 * Parses YAML frontmatter from markdown files.
 *
 * Input:
 * ```markdown
 * ---
 * title: "Hello World"
 * date: "2026-01-01"
 * ---
 * # Content here
 * ```
 *
 * Output:
 * ```js
 * {
 *   data: { title: "Hello World", date: "2026-01-01" },
 *   content: "# Content here"
 * }
 * ```
 */
import matter from 'gray-matter';
import { z } from 'zod';

/**
 * remark, remark-gfm & remark-html
 *
 * Converts markdown to HTML.
 *
 * remark = markdown parser (creates AST)
 * remark-gfm = GitHub Flavored Markdown (tables, strikethrough, task lists, …)
 * remark-html = converts AST to HTML string
 *
 * Pipeline: Markdown → AST → HTML
 */
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import html from 'remark-html';

// Import shared types (these CAN be used in Client Components)
import { CATEGORIES, type Category, type PostMeta, type Post } from './types';

// Import i18n config (NOT i18n.ts which is server-only)
import { type Locale, defaultLocale, locales } from './i18n-config';

// ============================================================================
// FRONTMATTER SCHEMA
// ============================================================================

// Treat empty strings as missing so `.default(...)` applies — lets drafts
// with blank fields (e.g. category: "") still parse instead of throwing.
const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const categoryEnum = z.enum(Object.keys(CATEGORIES) as [Category, ...Category[]]);

// Accept a YAML array (`categories: [note, tech]`), dropping blanks. Returns
// undefined when absent/empty so the transform below can fall back to `category`.
const cleanCategoriesInput = (v: unknown) => {
  if (!Array.isArray(v)) return undefined;
  const cleaned = v.filter((x) => x !== '' && x != null);
  return cleaned.length ? cleaned : undefined;
};

const PostFrontmatterSchema = z
  .object({
    title: z.preprocess(emptyToUndefined, z.string().default('Untitled')),
    date: z.preprocess(
      emptyToUndefined,
      z.string().default(() => new Date().toISOString().slice(0, 10))
    ),
    excerpt: z.string().default(''),
    author: z.preprocess(emptyToUndefined, z.string().default('Anonymous')),
    // Legacy single category (optional). The normalized `categories` array below
    // is the source of truth; `category` is recomputed from it in the transform.
    category: z.preprocess(emptyToUndefined, categoryEnum.optional()),
    // New multi-category field. Wins over `category` when present.
    categories: z.preprocess(cleanCategoriesInput, z.array(categoryEnum).optional()),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    youtubeUrl: z.string().optional(),
    collection: z.string().optional(),
    collectionOrder: z.number().optional(),
    collectionTitle: z.string().optional(),
  })
  .transform((fm) => {
    // Normalize: prefer `categories`, fall back to `[category]`, default to
    // `['daily']`. Dedupe while preserving order; keep `category` = first.
    const base = fm.categories?.length
      ? fm.categories
      : fm.category
        ? [fm.category]
        : (['daily'] as Category[]);
    const categories = Array.from(new Set(base)) as Category[];
    return { ...fm, category: categories[0], categories };
  });

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match?.[1] ?? null;
}

/** Unsplash images used as default cover when post has no coverImage. Same slug => same image. */
const UNSPLASH_COVERS = [
  'https://images.unsplash.com/photo-1483736762161-1d107f3c78e1?w=1074&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1034&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1074&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1074&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1074&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1074&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=1074&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547658719-da2b51169166?w=1074&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1074&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1074&q=80&auto=format&fit=crop',
];

function getDefaultCoverImage(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash << 5) - hash + slug.charCodeAt(i);
  const index = Math.abs(hash) % UNSPLASH_COVERS.length;
  return UNSPLASH_COVERS[index];
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

/**
 * RE-EXPORT FOR CONVENIENCE
 *
 * Some files import from blog.ts, so we re-export types here.
 * This way, they don't need to import from both blog.ts and types.ts.
 */
export { CATEGORIES, type Category, type PostMeta, type Post };

// ============================================================================
// PATHS
// ============================================================================

/**
 * POSTS DIRECTORY
 *
 * process.cwd() returns the project root directory.
 * path.join() safely combines paths (handles / vs \ on different OS).
 *
 * Result: /Users/you/nikki/posts
 */
const postsDirectory = path.join(process.cwd(), 'posts');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * calculateReadingTime
 * ====================
 *
 * Estimates how long it takes to read a post.
 * Average reading speed: 200 words per minute.
 *
 * @param content - The raw markdown content
 * @returns Reading time in minutes (as string, e.g., "5")
 */
function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  // Split by whitespace to count words
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes}`;
}

/**
 * getPostsDirectoryForLocale
 * ==========================
 *
 * Builds the path to a locale's posts directory.
 *
 * @param locale - 'fr' | 'en' | 'ja'
 * @returns Path like /Users/you/nikki/posts/fr
 */
function getPostsDirectoryForLocale(locale: Locale): string {
  return path.join(postsDirectory, locale);
}

/**
 * getAllMarkdownFiles
 * ===================
 *
 * Recursively finds all .md files in a directory.
 * Supports date-based folder structure like:
 * posts/en/2026-01-01/hello-world.md
 *
 * @param dir - Directory to search
 * @returns Array of { filePath, slug } objects
 */
function getAllMarkdownFiles(dir: string): { filePath: string; slug: string }[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results: { filePath: string; slug: string }[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively search subdirectories (date folders)
      results.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Extract slug from filename: hello-world.md → hello-world
      const slug = entry.name.replace(/\.md$/, '');
      results.push({ filePath: fullPath, slug });
    }
  }

  return results;
}

// ============================================================================
// POST RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * getAllPosts
 * ===========
 *
 * Gets all posts for a specific locale.
 * Returns metadata only (no content) for listing pages.
 * Supports date-based folder structure: posts/en/2026-01-01/hello-world.md
 *
 * USAGE:
 * ```tsx
 * // In Server Component
 * const posts = getAllPosts('fr');
 * return <PostList posts={posts} />;
 * ```
 *
 * @param locale - Which language's posts to get
 * @returns Array of PostMeta, sorted by date (newest first)
 */
export function getAllPosts(locale: Locale = defaultLocale): PostMeta[] {
  const localizedDir = getPostsDirectoryForLocale(locale);

  // Get all markdown files recursively (supports date-based folders)
  const markdownFiles = getAllMarkdownFiles(localizedDir);

  const posts = markdownFiles.map(({ filePath, slug }) => {
    // Read file contents
    const fileContents = fs.readFileSync(filePath, 'utf8');

    // Parse frontmatter
    const { data, content } = matter(fileContents);
    const frontmatter = PostFrontmatterSchema.parse(data);

    // Derive coverImage: explicit > youtube thumbnail > random Unsplash by slug
    const youtubeId = frontmatter.youtubeUrl ? extractYoutubeId(frontmatter.youtubeUrl) : null;
    const coverImage =
      frontmatter.coverImage?.trim() ||
      (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : getDefaultCoverImage(slug));

    // Build PostMeta object
    return {
      slug,
      ...frontmatter,
      coverImage,
      readingTime: calculateReadingTime(content),
      collection: frontmatter.collection,
      collectionOrder: frontmatter.collectionOrder,
      collectionTitle: frontmatter.collectionTitle,
    } as PostMeta;
  });

  // Sort by date, newest first
  return posts.sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
}

/**
 * getAllPostSlugs
 * ===============
 *
 * Gets just the slugs (filenames without .md) for a locale.
 * Used for generating static paths.
 * Supports date-based folder structure.
 *
 * @param locale - Which language's posts
 * @returns Array of slugs like ['hello-world', 'my-post']
 */
export function getAllPostSlugs(locale: Locale = defaultLocale): string[] {
  const localizedDir = getPostsDirectoryForLocale(locale);
  const markdownFiles = getAllMarkdownFiles(localizedDir);
  return markdownFiles.map(({ slug }) => slug);
}

/**
 * getAllPostSlugsWithLocales
 * ==========================
 *
 * Gets all slugs with their locales for generateStaticParams().
 * This enables static generation for all locale/slug combinations.
 *
 * USAGE IN PAGE:
 * ```tsx
 * export async function generateStaticParams() {
 *   return getAllPostSlugsWithLocales();
 *   // Returns: [
 *   //   { slug: 'hello-world', locale: 'fr' },
 *   //   { slug: 'hello-world', locale: 'en' },
 *   //   { slug: 'my-post', locale: 'fr' },
 *   // ]
 * }
 * ```
 */
export function getAllPostSlugsWithLocales(): { slug: string; locale: Locale }[] {
  const result: { slug: string; locale: Locale }[] = [];

  for (const locale of locales) {
    const slugs = getAllPostSlugs(locale);
    for (const slug of slugs) {
      result.push({ slug, locale });
    }
  }

  return result;
}

/**
 * getPostBySlug
 * =============
 *
 * Gets a single post with FULL content (including HTML).
 * Used on individual post pages.
 * Supports date-based folder structure.
 *
 * ASYNC because remark markdown processing is async.
 *
 * @param slug - The post's slug (filename without .md)
 * @param locale - Which language version
 * @returns Full Post object or null if not found
 */
export async function getPostBySlug(slug: string, locale: Locale = defaultLocale): Promise<Post | null> {
  const localizedDir = getPostsDirectoryForLocale(locale);

  // Find the post file recursively (supports date-based folders)
  const markdownFiles = getAllMarkdownFiles(localizedDir);
  const postFile = markdownFiles.find((file) => file.slug === slug);

  // Return null if post doesn't exist
  if (!postFile) {
    return null;
  }

  // Read and parse the file
  const fileContents = fs.readFileSync(postFile.filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const frontmatter = PostFrontmatterSchema.parse(data);

  /**
   * MARKDOWN TO HTML CONVERSION
   *
   * remark().use(remarkGfm).use(html).process(content)
   *
   * 1. remark() creates a processor
   * 2. .use(remarkGfm) enables GFM (pipe tables, etc.)
   * 3. .use(html) adds HTML output capability
   * 4. .process(content) runs the conversion
   * 5. .toString() gets the HTML string
   *
   * Input: "# Hello\n\nWorld"
   * Output: "<h1>Hello</h1>\n<p>World</p>"
   */
  const processedContent = await remark()
    .use(remarkGfm)
    .use(html)
    .process(content);
  const contentHtml = processedContent.toString();

  const youtubeId = frontmatter.youtubeUrl ? extractYoutubeId(frontmatter.youtubeUrl) : null;
  const coverImage =
    frontmatter.coverImage?.trim() ||
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : getDefaultCoverImage(slug));

  return {
    slug,
    ...frontmatter,
    coverImage,
    readingTime: calculateReadingTime(content),
    content: contentHtml,
    collection: frontmatter.collection,
    collectionOrder: frontmatter.collectionOrder,
    collectionTitle: frontmatter.collectionTitle,
  };
}

export function getRawPostBody(slug: string, locale: Locale = defaultLocale): string | null {
  const localizedDir = getPostsDirectoryForLocale(locale);
  const postFile = getAllMarkdownFiles(localizedDir).find((file) => file.slug === slug);
  if (!postFile) return null;
  const { content } = matter(fs.readFileSync(postFile.filePath, 'utf8'));
  return content;
}

/**
 * getAllCategories
 * ================
 *
 * Returns all available category keys.
 * Useful for building category filters.
 */
export function getAllCategories(): Category[] {
  return Object.keys(CATEGORIES) as Category[];
}

/**
 * getPostsByCategory
 * ==================
 *
 * Filters posts by category.
 */
export function getPostsByCategory(category: Category, locale: Locale = defaultLocale): PostMeta[] {
  const posts = getAllPosts(locale);
  return posts.filter((post) => post.categories.includes(category));
}

/**
 * getAllTags
 * ==========
 *
 * Collects all unique tags across all posts.
 */
export function getAllTags(locale: Locale = defaultLocale): string[] {
  const posts = getAllPosts(locale);
  const tagsSet = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => tagsSet.add(tag));
  });

  return Array.from(tagsSet).sort();
}

/**
 * getPostsByTag
 * =============
 *
 * Filters posts by tag.
 */
export function getPostsByTag(tag: string, locale: Locale = defaultLocale): PostMeta[] {
  const posts = getAllPosts(locale);
  return posts.filter((post) => post.tags.includes(tag));
}

// ============================================================================
// COLLECTION (BOOK / STORY) FUNCTIONS
// ============================================================================

/**
 * getAllCollectionSlugs
 * =====================
 *
 * Returns all unique collection slugs that have at least one post in the locale.
 */
export function getAllCollectionSlugs(locale: Locale = defaultLocale): string[] {
  const posts = getAllPosts(locale);
  const slugs = new Set<string>();
  posts.forEach((post) => {
    if (post.collection) slugs.add(post.collection);
  });
  return Array.from(slugs).sort();
}

/**
 * getPostsByCollection
 * ====================
 *
 * Returns posts in a collection, sorted by collectionOrder (asc) then date (newest first).
 * Posts without collectionOrder are placed after ordered ones, then by date.
 */
export function getPostsByCollection(
  collectionSlug: string,
  locale: Locale = defaultLocale
): PostMeta[] {
  const posts = getAllPosts(locale);
  const inCollection = posts.filter((p) => p.collection === collectionSlug);
  return inCollection.sort((a, b) => {
    const orderA = a.collectionOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.collectionOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * getCollectionInfo
 * =================
 *
 * Returns the collection display title and its posts.
 * Title: first post's collectionTitle (by collectionOrder) or slug.
 */
export function getCollectionInfo(
  collectionSlug: string,
  locale: Locale = defaultLocale
): { title: string; posts: PostMeta[] } {
  const posts = getPostsByCollection(collectionSlug, locale);
  const withTitle = posts.find((p) => p.collectionTitle?.trim());
  const title = withTitle?.collectionTitle?.trim() ?? collectionSlug;
  return { title, posts };
}

// ============================================================================
// I18N-SPECIFIC FUNCTIONS
// ============================================================================

/**
 * getPostAvailableLocales
 * =======================
 *
 * Checks which translations exist for a given post.
 * Used to show "Also available in: 🇬🇧 🇯🇵" links.
 * Supports date-based folder structure.
 *
 * @param slug - The post's slug
 * @returns Array of locales that have this post
 */
export function getPostAvailableLocales(slug: string): Locale[] {
  const available: Locale[] = [];

  for (const locale of locales) {
    const localizedDir = getPostsDirectoryForLocale(locale);
    const markdownFiles = getAllMarkdownFiles(localizedDir);
    if (markdownFiles.some((file) => file.slug === slug)) {
      available.push(locale);
    }
  }

  return available;
}

/**
 * getAllPostsAcrossLocales
 * ========================
 *
 * Gets all unique posts from all locales.
 * Used for the activity chart (shows all posts regardless of language).
 *
 * French is canonical - if a post exists in multiple languages,
 * we use the French metadata (for consistent dates, etc.).
 *
 * @returns Array of unique posts from all locales
 */
/**
 * getPostCanonicalLocaleMap
 * =========================
 *
 * Returns a map of slug → the first locale that has this post.
 * Used to build correct links for untranslated posts in the UI.
 * Locale priority: fr first (canonical), then en, then ja.
 */
export function getPostCanonicalLocaleMap(): Record<string, Locale> {
  const map: Record<string, Locale> = {};
  for (const locale of locales) {
    for (const { slug } of getAllMarkdownFiles(getPostsDirectoryForLocale(locale))) {
      if (!map[slug]) {
        map[slug] = locale;
      }
    }
  }
  return map;
}

export function getAllPostsAcrossLocales(): PostMeta[] {
  // French posts are the canonical source
  const frenchPosts = getAllPosts('fr');

  // Map to avoid duplicates (key = slug)
  const postsMap = new Map<string, PostMeta>();

  // Add French posts first
  for (const post of frenchPosts) {
    postsMap.set(post.slug, post);
  }

  // Add posts from other locales if they don't exist in French
  for (const locale of locales) {
    if (locale === 'fr') continue;

    const localePosts = getAllPosts(locale);
    for (const post of localePosts) {
      if (!postsMap.has(post.slug)) {
        postsMap.set(post.slug, post);
      }
    }
  }

  // Sort by date, newest first
  return Array.from(postsMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * getPostBySlugWithFallback
 * =========================
 *
 * Gets a post in the requested locale, falling back to French if not found.
 * This enables showing French posts to users browsing in English/Japanese
 * even if the translation doesn't exist yet.
 *
 * USAGE:
 * ```tsx
 * const result = await getPostBySlugWithFallback('hello-world', 'ja');
 * if (result) {
 *   const { post, actualLocale } = result;
 *   if (actualLocale !== 'ja') {
 *     // Show "Translation not available" notice
 *   }
 * }
 * ```
 *
 * @param slug - The post's slug
 * @param locale - Requested locale
 * @returns Post with actual locale, or null if not found anywhere
 */
export async function getPostBySlugWithFallback(
  slug: string,
  locale: Locale = defaultLocale
): Promise<{ post: Post; actualLocale: Locale } | null> {
  // Try requested locale first
  let post = await getPostBySlug(slug, locale);
  if (post) {
    return { post, actualLocale: locale };
  }

  // Fallback to French (the canonical language)
  if (locale !== 'fr') {
    post = await getPostBySlug(slug, 'fr');
    if (post) {
      return { post, actualLocale: 'fr' };
    }
  }

  // Not found in any locale
  return null;
}
