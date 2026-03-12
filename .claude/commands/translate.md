---
description: Translate an English blog post to French and Japanese
argument-hint: [slug] [date?]
allowed-tools: Read, Write, Glob, Bash(date:*)
---

Translate an English blog post into French (`fr`) and Japanese (`ja`).

## Arguments

- `$1` — slug of the post (e.g. `day-2`, `ddia-chapter-2-data-models-and-query-languages`). Required.
- `$2` — date folder in `YYYY-MM-DD` format. Optional — defaults to today's date.

## Steps

1. Determine the date:
   - If `$2` is provided and non-empty, use it.
   - Otherwise, get today's date: !`date +%Y-%m-%d`

2. Read the source file at `posts/en/{date}/{slug}.md`.

3. For each target locale (`fr`, `ja`), create a translated file at `posts/{locale}/{date}/{slug}.md`:

   ### What to translate

   - `title` — translate naturally (e.g. "Day 2" → "Jour 2" / "2日目")
   - `excerpt` — translate the excerpt
   - The full markdown body — translate all prose while preserving:
     - Markdown formatting (headings, bold, links, code blocks, tables)
     - Code snippets and technical terms inside backticks (keep as-is)
     - URLs (keep as-is)
     - Internal links like `/en/posts/...` — update the locale prefix to match (e.g. `/fr/posts/...`, `/ja/posts/...`)

   ### What to keep as-is

   - `date`, `author`, `category`, `tags`, `coverImage`, `youtubeUrl` — copy unchanged
   - Code blocks, inline code, and technical identifiers

   ### Footer

   Add a footer at the end of the translated post:

   - French: `---\n*Traduit par Claude*`
   - Japanese: `---\n*Claudeによる翻訳*`

   ### Section header translations

   For daily reports, translate the section header:
   - "## Today, I:" → "## Aujourd'hui, j'ai :" (fr) / "## 今日やったこと：" (ja)

4. Check if the translated files already exist. If they do, overwrite them (the translation should reflect the latest English version).

5. Print the paths of the created/updated files.
