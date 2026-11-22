---
title: "Claude Masterclass · 5: Claude Code, the basics"
date: "2026-11-22"
excerpt: "Installing Claude Code, the commands and modes you use every day, a first app built in Plan mode, committing and pushing with Claude, and CLAUDE.md as the project's memory."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-code", "git", "github", "vscode", "udemy"]
collection: "claude-masterclass"
collectionOrder: 5
collectionTitle: "Claude Masterclass (Udemy)"
---

## TL;DR

Claude Code is an agentic assistant **in your terminal**. It reads and edits your real files, runs commands and builds features from a conversation. It needs Pro or higher. The section covers installation, the core commands, a first app built in Plan mode, git and GitHub through Claude, and **CLAUDE.md** so the project's rules survive between sessions.

## Install and first run

```bash
curl -fsSL https://claude.ai/install.sh | bash   # macOS / Linux
irm https://claude.ai/install.ps1 | iex          # Windows PowerShell

cd ~/Desktop/"Claude Code Test"   # always start inside a project folder
claude                            # trust the folder
claude update                     # if it says your version is old
```

Inside the session, `/login` picks between **subscription** (recommended: a fixed monthly price, limits reset every few hours, and Claude Code on the web is included) and **Console API key** (pay per token, which adds up fast).

You can run it in the bare terminal, the **desktop app** (Code tab, the gentlest option), or in an IDE such as VS Code, Cursor or Antigravity. In an IDE, open the integrated terminal with `` Ctrl/Cmd+` `` and run `claude`, or install the **Claude Code extension** by Anthropic (look for the verified check). In Antigravity, close the default Gemini agent panel and use the extension instead.

## Everyday commands

```text
/terminal-setup   Shift+Enter = new line instead of send
/context          what's filling the 200k window (system, tools, MCP, skills, messages)
/clear            fresh conversation
/exit · /resume   quit, then pick a past conversation back up
/model            Opus (best), Sonnet (saves tokens), Haiku, plus effort level
/config           e.g. thinking mode on/off (off is faster but worse)
/theme · /statusline
```

**Shift+Tab** cycles between modes:
- **Default** asks before every edit or command.
- **Accept edits** edits files freely but still asks before risky actions.
- **Plan mode** touches no code. You discuss the work and get an implementation plan.

When the context window gets close to full, Claude Code **auto-compacts** (summarizes the history) and details get lost. Keep tasks small and `/clear` often.

## First app: a habit tracker

In Plan mode, describe the app: daily habits, mark done, streaks, a dashboard. Claude asks **clarifying questions** about the stack (React + Vite recommended) and storage (localStorage). Then it writes a plan; you choose *auto-accept edits*, and it scaffolds, installs, type-checks and starts the dev server. Total: about 7 minutes and 15k tokens. Later you run it with:

```bash
npm run dev
```

## Getting better results

- Bad input gives bad output. Treat Claude like a talented new hire who needs a proper brief.
- Think in **features, not products**: "a booking app with a calendar view, email confirmation, client login and payment" instead of "a booking app". That list is your PRD.
- **Test each feature** before moving on: "Write a quick test to make sure this feature works before we continue."

## Git and GitHub, handled by Claude

Git is the tool (local snapshots, unlimited undo); GitHub is the storage (an online backup you can collaborate on). You set this up once:

```bash
git --version
brew install gh        # or the installer from cli.github.com
gh auth login          # GitHub.com → HTTPS → Y → login with browser
```

Then:

```text
Please create a GitHub repository for this project and, from now on,
commit all changes with clear messages and push them regularly.
```

Claude writes a `.gitignore` and README, makes the initial commit, creates the repo and pushes. GitHub credits Claude as a co-author.

## CLAUDE.md is the project's memory

A new session **remembers nothing**: Claude can read the git log, but it won't know the rules you set. The fix is `CLAUDE.md`, which is read automatically at the start of every session.

```text
/init     # scans the repo → drafts CLAUDE.md (overview, architecture, how to run)
```

Then add your own rules:

```markdown
## Git workflow
After every meaningful change, commit with a concise message and push to GitHub.
Always explain what you're about to do before changing things.
Always ask before deleting files.
```

Make it a habit to run `/init` at the start of every project and update the file whenever Claude should remember something.
