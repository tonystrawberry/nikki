---
description: Create a new English blog post
argument-hint: [slug] [date?]
allowed-tools: Write, Bash(date:*)
---

Create a new English blog post.

## Arguments

- `$1` — slug for the post (e.g. `day-3`, `my-first-post`). Required.
- `$2` — date in `YYYY-MM-DD` format. Optional — defaults to today's date.

## Steps

1. Determine the date:
   - If `$2` is provided and non-empty, use it as-is.
   - Otherwise, get today's date: !`date +%Y-%m-%d`

2. Create the file at `posts/en/{date}/{slug}.md` with this frontmatter template:

```markdown
---
title: ""
date: "{date}"
excerpt: ""
author: "Tony Duong"
category: "daily"
tags: []
---

## Today, I:

-
```

Replace `{date}` with the resolved date and `{slug}` with `$1`.

3. Confirm the file was created and print its path.

Do not open or edit the file further — just create it.
