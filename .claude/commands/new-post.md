---
description: Create a new English blog post
argument-hint: <slug> [date]
allowed-tools: Read, Write, Bash, Glob, AskUserQuestion
---

Create a new English blog post.

## Arguments

- `$ARGUMENTS` — slug for the post (e.g. `day-3`, `my-first-post`). Optionally followed by a date in `YYYY-MM-DD` format. If no date is given, use today's date.

## Steps

1. Parse arguments:
   - First word = slug (e.g. `day`, `day-8`, `my-first-post`)
   - Second word (if present and matches `YYYY-MM-DD`) = date
   - Otherwise, get today's date: !`date +%Y-%m-%d`

2. **If slug is `day`:** Resolve slug to `day-{N}` where N is the next day number: find all `posts/en/*/day-*.md` files, take the highest N (e.g. day-7 → 7), set slug = `day-{N+1}` (e.g. `day-8`). If no day-*.md exists, use `day-1`.

3. If no slug is provided, ask the user for one using AskUserQuestion.

4. Create the file at `posts/en/{date}/{slug}.md` with this template:

```markdown
---
title: ""
date: "{date}"
excerpt: ""
author: "Tony Duong"
category: ""
tags: []
---

```

Replace `{date}` with the resolved date. If slug is `day-{N}`, set `title` to `"Day {N}"` and `category` to `"daily"` (optional but consistent with daily posts).

5. Confirm the file was created and print its path.
