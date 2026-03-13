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
   - First word = slug
   - Second word (if present and matches `YYYY-MM-DD`) = date
   - Otherwise, get today's date: !`date +%Y-%m-%d`

2. If no slug is provided, ask the user for one using AskUserQuestion.

3. Create the file at `posts/en/{date}/{slug}.md` with this template:

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

Replace `{date}` with the resolved date.

4. Confirm the file was created and print its path.
