import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { CATEGORIES, type Category, type PostMeta, type Post } from './types';
import { type Locale, defaultLocale, locales } from './i18n-config';

// Re-export types and constants for convenience
export { CATEGORIES, type Category, type PostMeta, type Post };

const postsDirectory = path.join(process.cwd(), 'posts');

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes}`;
}

function getPostsDirectoryForLocale(locale: Locale): string {
  return path.join(postsDirectory, locale);
}

export function getAllPosts(locale: Locale = defaultLocale): PostMeta[] {
  const localizedDir = getPostsDirectoryForLocale(locale);

  // Ensure posts directory exists
  if (!fs.existsSync(localizedDir)) {
    return [];
  }

  const fileNames = fs.readdirSync(localizedDir);
  const posts = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(localizedDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || 'Untitled',
        date: data.date || new Date().toISOString(),
        excerpt: data.excerpt || '',
        author: data.author || 'Anonymous',
        category: (data.category as Category) || 'life',
        tags: data.tags || [],
        coverImage: data.coverImage,
        readingTime: calculateReadingTime(content),
      } as PostMeta;
    });

  // Sort posts by date (newest first)
  return posts.sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
}

export function getAllPostSlugs(locale: Locale = defaultLocale): string[] {
  const localizedDir = getPostsDirectoryForLocale(locale);

  if (!fs.existsSync(localizedDir)) {
    return [];
  }

  const fileNames = fs.readdirSync(localizedDir);
  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => fileName.replace(/\.md$/, ''));
}

// Get all slugs across all locales for static generation
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

export async function getPostBySlug(slug: string, locale: Locale = defaultLocale): Promise<Post | null> {
  const localizedDir = getPostsDirectoryForLocale(locale);
  const fullPath = path.join(localizedDir, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Process markdown to HTML
  const processedContent = await remark()
    .use(html)
    .process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString(),
    excerpt: data.excerpt || '',
    author: data.author || 'Anonymous',
    category: (data.category as Category) || 'life',
    tags: data.tags || [],
    coverImage: data.coverImage,
    readingTime: calculateReadingTime(content),
    content: contentHtml,
  };
}

export function getAllCategories(): Category[] {
  return Object.keys(CATEGORIES) as Category[];
}

export function getPostsByCategory(category: Category, locale: Locale = defaultLocale): PostMeta[] {
  const posts = getAllPosts(locale);
  return posts.filter((post) => post.category === category);
}

export function getAllTags(locale: Locale = defaultLocale): string[] {
  const posts = getAllPosts(locale);
  const tagsSet = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => tagsSet.add(tag));
  });

  return Array.from(tagsSet).sort();
}

export function getPostsByTag(tag: string, locale: Locale = defaultLocale): PostMeta[] {
  const posts = getAllPosts(locale);
  return posts.filter((post) => post.tags.includes(tag));
}

// Get available locales for a specific post
export function getPostAvailableLocales(slug: string): Locale[] {
  const available: Locale[] = [];

  for (const locale of locales) {
    const localizedDir = getPostsDirectoryForLocale(locale);
    const fullPath = path.join(localizedDir, `${slug}.md`);
    if (fs.existsSync(fullPath)) {
      available.push(locale);
    }
  }

  return available;
}

// Get all unique posts across all locales (uses French as canonical source)
// This is used for the activity chart to show all posts regardless of language
export function getAllPostsAcrossLocales(): PostMeta[] {
  // French is always the canonical source - all posts must exist in French
  const frenchPosts = getAllPosts('fr');

  // Create a map of slug -> post to avoid duplicates
  const postsMap = new Map<string, PostMeta>();

  // Add French posts first (canonical)
  for (const post of frenchPosts) {
    postsMap.set(post.slug, post);
  }

  // Check other locales for any posts that might only exist there
  // (though ideally all posts should have a French version)
  for (const locale of locales) {
    if (locale === 'fr') continue;

    const localePosts = getAllPosts(locale);
    for (const post of localePosts) {
      if (!postsMap.has(post.slug)) {
        postsMap.set(post.slug, post);
      }
    }
  }

  // Sort by date (newest first)
  return Array.from(postsMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Get post by slug with fallback to French
export async function getPostBySlugWithFallback(
  slug: string,
  locale: Locale = defaultLocale
): Promise<{ post: Post; actualLocale: Locale } | null> {
  // Try the requested locale first
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

  return null;
}
