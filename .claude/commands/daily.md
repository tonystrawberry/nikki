---
description: Add a point to today's daily report
argument-hint: [summary of what you did]
allowed-tools: Read, Edit, Write, Bash(date:*), Glob
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

7. Print the updated/created file path and the point that was added.
