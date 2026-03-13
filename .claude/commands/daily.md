---
description: Add a point to today's daily report
argument-hint: [summary of what you did]
allowed-tools: Read, Edit, Write, Bash, Glob, WebFetch
---

Add a bullet point to today's daily report.

## Arguments

- `$ARGUMENTS` — a summary of what the user did. Required.

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

   c. In the daily report bullet point, link to the memo article: `[Title](/en/posts/{date}/{slug})`.

8. Print the updated/created file path(s) and the point that was added.
