/**
 * BOOKS - src/lib/books.ts
 * ========================
 *
 * Server-only helpers for the reading list. Data is stored in data/books.json.
 * Used by the /[locale]/books page.
 *
 * Each item: title, author, readAt (YYYY-MM-DD, the day I finished it), an optional
 * `cover` image path (stored in public/images/books/), and optional notes links:
 * `collection` (chapter notes at /[locale]/collection/{slug}) or `post` (a single
 * post at /[locale]/posts/{slug}). If both are set, `collection` wins.
 */

import "server-only";
import fs from "fs";
import path from "path";

export interface BookItem {
  title: string;
  author: string;
  readAt: string;
  cover?: string;
  collection?: string;
  post?: string;
}

const BOOKS_PATH = path.join(process.cwd(), "data", "books.json");

/**
 * Returns all books, most recently read first.
 */
export function getBooks(): BookItem[] {
  try {
    const data = JSON.parse(fs.readFileSync(BOOKS_PATH, "utf8")) as { items?: BookItem[] };
    const items = Array.isArray(data.items) ? data.items : [];
    return [...items].sort((a, b) => b.readAt.localeCompare(a.readAt));
  } catch {
    return [];
  }
}
