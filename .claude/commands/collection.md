---
description: Create a collection or add posts to a collection
argument-hint: new <slug> "<title>" [pattern] | add <slug> "<title>" <post-slug> [order] [post-slug] [order] ...
allowed-tools: Read, Write, Glob, StrReplace
---

Create a new collection (book/series) or add existing posts to a collection. Collections appear at `/[locale]/collections` and `/[locale]/collection/{slug}`.

## Arguments

- `$ARGUMENTS` — one of:
  - **`new <collection-slug> "<collection title>" [slug-pattern]`** — Create a new collection.
    - Registers the collection in the daily command's Known collections table (`.claude/commands/daily.md`) so future daily memos that match the pattern get collection frontmatter automatically.
    - `slug-pattern` is optional; if provided, add a row to the table (regex-style pattern with one `(\d+)` group for order, e.g. `mybook-chapter-(\d+)-*`).
  - **`add <collection-slug> "<collection title>" <post-slug> [order] [<post-slug> [order] ...]`** — Add one or more posts to an existing collection.
    - Finds every post file whose slug (filename without `.md`) equals the given `post-slug` under `posts/{en,fr,ja}/**/*.md`.
    - Adds (or updates) frontmatter: `collection: "<collection-slug>"`, `collectionOrder: <order>`, `collectionTitle: "<collection title>"`. If `order` is omitted for a post, use the next integer (1, 2, 3...) or leave `collectionOrder` unset.

## Steps

### For `new`

1. Parse args: first word `new`, then collection slug, then a quoted string (collection title), then optional slug pattern.
2. Open `.claude/commands/daily.md` and locate the "Known collections" table (markdown table with columns: Collection slug, Slug pattern(s), collectionTitle, How to get collectionOrder).
3. Append a new row to the table:
   - Collection slug: the given `<collection-slug>`
   - Slug pattern(s): the given pattern or `(none — use \`collection add\` only)` if not provided
   - collectionTitle: the given quoted title
   - How to get collectionOrder: e.g. "First captured number from slug" if pattern has `(\d+)`, else "Set manually via \`collection add\`"
4. If the user also wants to add existing posts to this collection in the same run, treat remaining args as for `add` (see below).

### For `add`

1. Parse args: first word `add`, then collection slug, then quoted collection title, then one or more `<post-slug> [order]` pairs. If a post has no order, use the next integer starting from 1 or omit `collectionOrder`.
2. For each post slug:
   - Glob search: `posts/**/*.md` (or per locale `posts/en/**/*.md`, `posts/fr/**/*.md`, `posts/ja/**/*.md`).
   - Match files whose basename (without `.md`) equals the post slug (e.g. `posts/en/2026-03-18/ddia-chapter-6-partitioning.md` → slug `ddia-chapter-6-partitioning`).
3. For each matching file:
   - Read the file and parse the frontmatter (YAML between first `---` and second `---`).
   - Add or update: `collection: "<collection-slug>"`, `collectionOrder: <order>` (if order was given), `collectionTitle: "<collection title>"`. Place these after existing frontmatter fields and before the closing `---`.
   - If the file already has `collection` / `collectionOrder` / `collectionTitle`, update them in place.
4. Write the file back with the updated frontmatter.

## Examples

- `collection new my-book "My Book" "my-book-chapter-(\d+)-*"` — Register collection `my-book` with title "My Book" and a slug pattern so daily-created memos like `my-book-chapter-1-intro` get collection frontmatter.
- `collection add ddia "Designing Data-Intensive Applications" ddia-chapter-7-stream-processing 7` — Add the post with slug `ddia-chapter-7-stream-processing` to the `ddia` collection with order 7 (in all locales where that file exists).
- `collection add my-book "My Book" post-one 1 post-two 2` — Add two posts to `my-book` with orders 1 and 2.

## Notes

- Collection slug must be URL-safe (lowercase, hyphens). Used in routes like `/en/collection/ddia`.
- At least one post in a collection should have `collectionTitle` set so the collection page shows a human-readable title (you can set it on every post).
- To create a new collection and add posts in one go, run `new` first, then `add` in a separate invocation, or combine in one command if the tool supports it.
