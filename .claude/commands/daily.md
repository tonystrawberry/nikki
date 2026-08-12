---
description: Add a point to today's daily report
argument-hint: [summary of what you did]
allowed-tools: Read, Edit, Write, Bash, Glob, WebFetch
---

Add a bullet point to today's daily report.

## Arguments

- `$ARGUMENTS` — a summary of what the user did. Required.

## Known collections

When creating a **book chapter** or **video** memo, if the slug matches a known collection, add these frontmatter fields so the post appears in the collection page (`/[locale]/collection/{slug}`):

| Collection slug | Slug pattern(s) | collectionTitle | How to get collectionOrder |
|-----------------|-----------------|-----------------|----------------------------|
| `ddia` | `ddia-chapter-(\d+)-*`, `designing-data-intensive-applications-chapter-(\d+)` | "Designing Data-Intensive Applications" | First captured number from slug (chapter number) |
| `career-story` | `career-story-chapter-(\d+)-*` | "Story of My Career" | First captured number from slug (chapter number) |
| `poodr` | `poodr-chapter-(\d+)-*` | "Practical Object-Oriented Design in Ruby" | First captured number from slug (chapter number) |
| `system-design-interview` | `system-design-interview-chapter-(\d+)-*` | "System Design Interview" | First captured number from slug (chapter number) |

- **Slug patterns** are regex-style: `ddia-chapter-(\d+)-*` means slugs like `ddia-chapter-7-partitioning`; the `(\d+)` is the chapter number.
- Add to **every** memo that matches: `collection: "{slug}"`, `collectionOrder: {N}`, `collectionTitle: "{title}"`.
- To add a new collection, update this table and (optionally) use the `collection` command to add frontmatter to existing posts.

## Steps

1. Get today's date: !`date +%Y-%m-%d`

2. Look for an existing daily report file matching today's date:
   - Search for files at `posts/en/{today's date}/day-*.md`
   - If found, read the file to confirm it has `category: "daily"` in frontmatter.

3. **If no file exists for today:**
   - Determine the day number by finding the highest existing `day-N.md` across all `posts/en/*/day-*.md` files and incrementing by 1.
   - Create `posts/en/{date}/day-{N}.md` using this template:

```markdown
---
title: "Day {N}"
date: "{date}"
excerpt: ""
author: "Tony Duong"
category: "daily"
tags: ["engineering"]
coverImage: ""
---

## Today, I:

- {point}
```

   Replace `{date}`, `{N}`, and `{point}` with actual values.

4. **If the file exists:**
   - Append a new `- {point}` line at the end of the bullet list (after the last `- ` line).

5. The point should be written in first person, lowercase start (no capital), no trailing period — matching the style of existing entries. Rewrite the user's summary to match this tone if needed. Keep it concise but preserve all meaningful detail.

6. **Update frontmatter if necessary:**
   - `excerpt`: rewrite to summarize all bullet points in one sentence (keep it short).
   - `tags`: add any new relevant tags from the new point (don't remove existing ones).

7. **If the point references a YouTube video or a book chapter**, create a memo article:

   a. **YouTube video:**
      - Fetch the video title using noembed API: `curl -s "https://noembed.com/embed?url={url}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('title',''))"`
      - Download subtitles using yt-dlp: `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o "/tmp/yt-sub" "{url}"`
      - Parse the VTT file into plain text (strip timestamps, tags, and deduplicate lines).
      - Use the subtitle text to write a structured summary of the video.
      - Create a slug from the video title (lowercase, hyphens, no special chars).
      - Create `posts/en/{date}/{slug}.md` with:
        - `category: "note"`, relevant `tags`, `youtubeUrl` set to the video URL
        - Content: a structured summary of the video's key points based on the subtitles, organized into sections with `##` headings and bullet points for takeaways.

   b. **Book chapter:**
      - Create a slug like `{book-short-name}-chapter-{N}-{chapter-title}` (e.g. `ddia-chapter-3-storage-and-retrieval`).
      - Create `posts/en/{date}/{slug}.md` with:
        - `category: "note"`, relevant `tags`
        - Content: a structured summary of the chapter organized into sections with `##` headings, key concepts explained, and a `## Key Takeaways` section at the end.
      - Use your own knowledge of the book to write the summary. If you're unsure of the content, note that in the article.
      - **Collection:** If the slug matches a known collection (see table above), add to the frontmatter immediately after the other fields (before the closing `---`): `collection: "{slug}"`, `collectionOrder: {N}` (chapter number from slug), `collectionTitle: "{title}"`. Example: for `ddia-chapter-7-something` add `collection: "ddia"`, `collectionOrder: 7`, `collectionTitle: "Designing Data-Intensive Applications"`.

   c. **YouTube video + collection:** If the memo slug you chose matches a known collection (e.g. `ddia-chapter-7-...` for a DDIA chapter video), add `collection`, `collectionOrder`, and `collectionTitle` to the created post's frontmatter.

   d. In the daily report bullet point, link to the memo article: `[Title](/en/posts/{slug})` (the app uses slug-only URLs, e.g. `/en/posts/ddia-chapter-6-partitioning`).

8. Print the updated/created file path(s) and the point that was added.
