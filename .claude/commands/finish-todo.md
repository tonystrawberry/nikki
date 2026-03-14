---
description: Mark a TODO as done by its number ID
argument-hint: [TODO number, e.g. 1 or 3]
allowed-tools: Read, Write, Glob
---

Mark a TODO as finished by its ID. The list is stored in `data/todos.json` and displayed on the `/[locale]/todo` page.

## Arguments

- `$ARGUMENTS` — the TODO ID (number), e.g. `1`, `2`, `3`. Required.

## Steps

1. **Resolve the data file path:** `data/todos.json` at the project root.

2. **Read the store:**
   - If `data/todos.json` does not exist or is invalid, tell the user the TODO list is empty or missing and stop.
   - Parse the JSON. Structure: `{ "items": [ { "id": number, "text": string, "done": boolean, "createdAt": string } ] }`.

3. **Find the item** with `id` equal to the number from `$ARGUMENTS` (parse as integer). If no item has that ID, tell the user "No TODO with ID {id}" and stop.

4. **Update the item:** set `done: true`. Optionally set `completedAt` to today in `YYYY-MM-DD`.

5. **Write** `data/todos.json` with the updated `items` (pretty-printed JSON, e.g. 2-space indent).

6. **Confirm** to the user: e.g. "Marked TODO #{id} as done: {item.text}"
