---
description: Translate missing EN posts to FR and JA
argument-hint: [optional: specific file or date to translate]
allowed-tools: Read, Write, Bash, Glob, Agent
---

Find and translate all English posts that are missing French or Japanese translations.

## Arguments

- `$ARGUMENTS` — optional. A specific file path, date, or slug to translate. If empty, find ALL missing translations.

## Steps

1. **Find missing translations:**
   - List all files under `posts/en/` using Glob.
   - For each EN file, check if corresponding files exist under `posts/fr/` and `posts/ja/` (same date folder and filename).
   - If `$ARGUMENTS` is provided, filter to only matching files.
   - Print a summary of what's missing before starting.

2. **Translate each missing file** by launching parallel Agent tasks (one per file per locale). For each translation:

   a. Read the EN source file.

   b. Create `posts/{locale}/{date}/{slug}.md` with:
      - **Frontmatter:** Keep `date`, `author`, `category`, `tags`, `coverImage`, `youtubeUrl` unchanged. Translate `title` and `excerpt`.
      - **Body:** Translate all prose to the target language. Preserve:
        - Markdown formatting, headings, bullet points, tables
        - Code in backticks (inline and blocks)
        - URLs (but update internal links from `/en/posts/` to `/{locale}/posts/`)
        - Technical terms, tool names, library names
      - **Heading style for daily posts:** Use `## Aujourd'hui, j'ai :` (FR) or `## 今日やったこと：` (JA) instead of `## Today, I:`
      - **Footer:** Append `---\n*Traduit par Claude*` (FR) or `---\n*Claudeによる翻訳*` (JA)

3. **Maximize parallelism:** Launch up to 6 Agent tasks at once (one per file×locale combination).

4. Print a summary table of all translations created.
