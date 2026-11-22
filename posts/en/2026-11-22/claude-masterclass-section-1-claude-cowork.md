---
title: "Claude Masterclass · 1: Claude Cowork"
date: "2026-11-22"
excerpt: "Cowork is a chatbot that acts on your computer: it works with your files, drives your browser, runs recurring tasks and uses connectors, and you can reach it from your phone with Dispatch."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-cowork", "automation", "mcp", "udemy"]
collection: "claude-masterclass"
collectionOrder: 1
collectionTitle: "Claude Masterclass (Udemy)"
---

## TL;DR

**Claude Cowork** is in the Claude desktop app. A normal chatbot only gives advice; Cowork **acts**: it renames and sorts your files, writes reports, drives your browser and replays workflows on a schedule. It has the same execution power as Claude Code, but in a visual app with no terminal and no code.

| | Claude Code | Claude Cowork |
|---|---|---|
| Interface | CLI / IDE | Desktop app (visual) |
| Audience | Developers | Anyone who works with files and apps |
| Works on | Codebases, git, terminal | Folders, documents, browser, apps |

## Setup

- Download the desktop app from claude.com/download and sign in. Cowork needs a paid plan.
- Switch the app from **Chat** to **Cowork**.

## Working with folders

You grant access to a folder and then describe the job in plain language:

```text
Please rename all files in my invoices folder by adding the invoice
date at the start of each file name (YYYY-MM-DD_...).
```

Claude scans the files, pulls each date out of the content, renames everything and checks the result. It copes with mixed naming schemes and formats.

Other examples from the course:
- Cut a **10-second timelapse** out of a long video.
- Turn a folder of receipts into a summary.
- Turn a brand-assets folder into a downloadable **PPTX**.
- **Queue** several tasks and keep working while they run.

> Cowork only pays off when a task is big. Renaming three files isn't worth it; three hundred is.

## Browser tasks (Claude in Chrome)

- Install the **Claude in Chrome** extension and sign in with the same account.
- Start a task with "do it in the browser" from the desktop app or the extension.
- Each task gets its own **Chrome tab group**, which you can close and reopen in one click (Section 9 has more on this).

## Teach Claude, then schedule it

**Teach Claude** is only in the Chrome extension. You hit *Start recording*, do the task while narrating into the mic, and Claude saves it as a **shortcut**.

- Run it again with `/shortcut-name`.
- Edit it under ⋯ → Settings → Shortcuts.
- **Schedule** it, for example every Monday: read the "LinkedIn Posting" sheet and publish the post.

## Connectors (MCP)

Find them under Customize → **Connectors** (alongside Skills and Plugins). There are ready-made ones for Gmail, Notion, Slack, Canva, Figma, HubSpot and Google Calendar. For anything else, use **Add custom connector** with the app's MCP server URL.

```text
Go to Gmail, pull the last 10 emails I sent, and create a PDF that
describes my writing voice and tone.
```

That PDF later becomes a **skill** for drafting emails in your voice. Claude picks the right connector on its own, and you can say "use the Gmail connector" if it doesn't.

## Computer use and Dispatch

- **Computer use**: Claude controls your whole machine (apps, mouse, keyboard), not just one granted folder or the browser.
- **Dispatch**: send tasks to your desktop's Cowork **from your phone**. Turn on file access and "keep the computer awake", or tasks won't run while it sleeps. The instructor's advice is to keep sensitive files off that machine.

## Bonus: build a website in Cowork

Create a **Project**, which keeps files, instructions and a local folder shared across chats. Paste a website requirements template, answer Claude's questions, and it generates the whole site structure. Then host it.

## Exercises
1. Clean up a messy folder (by date, by type, removing duplicates) and compare before and after.
2. Do a real task with the browser agent.
3. Teach Claude a repetitive workflow, then trigger the shortcut.
