---
description: Add an item to the TODO list (things to do later)
argument-hint: [what you want to do, e.g. "learn LocalStack" or "read DDIA"]
allowed-tools: Read, Write, Glob
---

Add a new TODO to the list. The list is stored in `data/todos.json` and displayed on the `/[locale]/todo` page.

## Arguments

- `$ARGUMENTS` — the TODO text (e.g. "learn how to use LocalStack", "read Designing Data-Intensive Applications"). Required.

## Steps

1. **Resolve the data file path:** `data/todos.json` at the project root.

2. **Read or create the store:**
   - If `data/todos.json` exists, read it and parse the JSON.
   - If it does not exist or is invalid, treat the store as `{ "items": [] }`.
   - Ensure the structure is `{ "items": [ { "id": number, "text": { "en": string, "fr": string, "ja": string }, "done": boolean, "createdAt": string } ] }`. Note `text` is a localized object with all three locales at the same level.

3. **Compute the next ID:**
   - If `items` is empty, use `1`.
   - Otherwise use `max(items[].id) + 1`.

4. **Format the English text:** Do not copy `$ARGUMENTS` verbatim. Correct English and formatting: sentence case (first letter capitalized), capitalize proper nouns (product names like LocalStack, AWS, certification names), fix typos (e.g. "cloudops" → "CloudOps"). This is the `en` text.

5. **Translate** the formatted text into French (`fr`) and Japanese (`ja`). Keep proper nouns, product names, book/video titles, and URLs as-is; translate only the surrounding wording (e.g. "Watch:" → "Regarder :" / "視聴する：", "Read X" → "Lire X" / "X を読む"). Natural, concise phrasing matching the existing entries.

6. **Append the new item:**
   - `id`: from step 3.
   - `text`: `{ "en": ..., "fr": ..., "ja": ... }` from steps 4–5.
   - `done`: `false`.
   - `createdAt`: today in `YYYY-MM-DD` (use current date).

7. **Write** `data/todos.json` with the updated `items` array (pretty-printed JSON, e.g. 2-space indent).

8. **Confirm** to the user: e.g. "Added TODO #N: {text.en}"
