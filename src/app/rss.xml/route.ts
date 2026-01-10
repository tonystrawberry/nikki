/**
 * RSS FEED - src/app/rss.xml/route.ts
 * ====================================
 *
 * Generates an RSS 2.0 feed for the blog.
 * Accessible at /rss.xml
 *
 * RSS allows readers to subscribe to your blog using feed readers like:
 * - Feedly
 * - Inoreader
 * - NetNewsWire
 * - And many more!
 */

import { getAllPosts } from "@/lib/blog";

// Site configuration
const SITE_URL = "https://nikki.tonystrawberry.com"; // Update this with your actual domain
const SITE_TITLE = "nikki";
const SITE_DESCRIPTION = "A personal diary about life, thoughts, and experiences";
const AUTHOR_NAME = "Tony";
const AUTHOR_EMAIL = "tony.duong.102@gmail.com";

/**
 * Escape special XML characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * GET handler - generates the RSS XML
 */
export async function GET() {
  // Get all posts (using French as the primary content source)
  const posts = getAllPosts("fr");

  // Build RSS items
  const items = posts
    .map((post) => {
      const postUrl = `${SITE_URL}/fr/posts/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
      <author>${AUTHOR_EMAIL} (${AUTHOR_NAME})</author>
      <category>${escapeXml(post.category)}</category>
    </item>`;
    })
    .join("");

  // Build the full RSS feed
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>fr</language>
    <managingEditor>${AUTHOR_EMAIL} (${AUTHOR_NAME})</managingEditor>
    <webMaster>${AUTHOR_EMAIL} (${AUTHOR_NAME})</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  // Return the RSS feed with proper content type
  return new Response(rss.trim(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}

