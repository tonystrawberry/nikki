---
title: "Claude Masterclass · 6: Advanced Claude Code"
date: "2026-11-22"
excerpt: "Plan mode first, subagents to keep the main context clean, skills in Claude Code, deploying to Vercel, and a full capstone: a café website with an n8n AI assistant and bookings."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-code", "subagents", "vercel", "n8n", "udemy"]
collection: "claude-masterclass"
collectionOrder: 6
collectionTitle: "Claude Masterclass (Udemy)"
---

## TL;DR

Plan before you build. Delegate to **subagents** so the main conversation stays clean. Add **skills** for repeatable know-how. Ship by pushing to GitHub and importing the repo into **Vercel**.

*Note: Udemy's captions are broken for the Plan mode, Skills and capstone videos, so those parts come from the exercise sheets.*

## Plan mode, done right

The demo builds a **finance tracker** (it later gets a budget-limit feature). The loop is: describe the app → **answer Claude's clarifying questions** → review the plan → only then build. Keep the plan file and reuse it. "Ten minutes of planning saves hours."

## Subagents

The main agent is a **manager**. Subagents do the heavy lifting in **their own context windows** and return only a **short summary**, a few hundred tokens instead of about 70k.

Built-in agents:

| Agent | Role |
|---|---|
| `general-purpose` | All tools, broad multi-step searches |
| `Explore` | Find files and answer codebase questions (read-only) |
| `Plan` | Architect: implementation plans, critical files (read-only) |
| `statusline-setup` | Configures the status bar |
| `claude-code-guide` | Answers questions about Claude Code and the API (web search) |

```text
@claude-code-guide can you explain what skills are?      # talk to one agent

Please use two Explore agents to summarize the tech stack
and the main features of this project.                   # let the main agent delegate

Ctrl+B        → send running agents to the background
Ctrl+B, ↓     → background tasks panel
```

Measured in the demo: the main agent alone used **15%** of context, and two parallel Explore agents used **10%**, with **better** results because each had a narrower brief. Subagents don't use fewer tokens in total; they **protect the main thread** from filling up and compacting.

### Custom agent

`/agents` → Create → **Project** scope (`.claude/agents/`) or User scope → *Generate with Claude* → choose tools, model (Sonnet is cheaper for routine reviews), colour and memory.

```markdown
---
name: design-reviewer
description: Senior UI/UX reviewer. Use to check and improve layout, spacing,
  colours, typography, usability and responsiveness.
tools: Read, Edit, Write, Bash, Glob, Grep
model: sonnet
---
Review the app visually and for UX. If something can be improved, fix it.
```

```text
Use the design-reviewer agent to check the design and make any improvements.
Don't change anything yourself; let the reviewer handle it.
```

## Skills in Claude Code

Skills live in `.claude/skills/<name>/SKILL.md` and are loaded when their description matches the task. You can find them on **skills.sh**, in Anthropic's skills repo or in the plugin directory. Recommended: **frontend-design** for professional-looking UIs. A neat trick is to install **find-skills** first, then let Claude find and install what you need.

## Deploying to Vercel

Building is for you; deploying is for everyone.

```text
Please commit all pending changes with a clear message and push to GitHub.
# not a repo yet? →
Please do both: initialise git and create a new public GitHub repository.
```

Then go to vercel.com, sign in with GitHub, **Add New Project**, import the repo and click **Deploy**. It auto-detects the framework and takes under a minute. You can add a custom domain under *Domains*. **Every push redeploys**, so commit locally and push in batches (the instructor says the free tier limits redeploys). Netlify works the same way.

## Capstone: café site and n8n assistant

1. Plan → build → test. Install skills (frontend-design), write **your own skill**, and add **two subagents**: one for design, one for content or code review.
2. Self-host **n8n** (on a Hostinger VPS in the course). Build a **chatbot with a real knowledge base** and a **booking form** whose submissions land in n8n through a webhook.
3. Review with the subagents, push, deploy. Turn on **webhook auth** and set your **env vars in Vercel**.
