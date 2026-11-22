---
title: "Claude Masterclass · 10: Claude and other tools"
date: "2026-11-22"
excerpt: "Plugging Claude into Excalidraw, Higgsfield, Canva, NotebookLM, ElevenLabs, Firecrawl, Notion and Google Stitch, mostly through MCP servers, connectors and skills set up by Claude Code."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-code", "mcp", "integrations", "udemy"]
collection: "claude-masterclass"
collectionOrder: 10
collectionTitle: "Claude Masterclass (Udemy)"
---

## TL;DR

Most integrations follow one of three patterns:
1. Turn on a **built-in connector** (Canva, Notion).
2. Point **Claude Code** at a repo with "read the README, install and run it locally", which sets up a local MCP server or CLI.
3. Add a **skill** that teaches Claude how to prompt the other tool well.

```text
Go to <repo URL> and set up <tool> for me. Read the README first,
then do the whole install locally: clone, install deps, build, run,
and connect it to Claude.
```

## The integrations

| Tool | What you get | How |
|---|---|---|
| **Excalidraw** | Complex diagrams in seconds, from a description, structured text or a screenshot | Open-source Excalidraw MCP installed locally by Claude Code. It does more than the official connector |
| **Higgsfield** | Images and video (GPT Image, Nano Banana, Seedance, Veo 3.1) | Connect it, then add the course's **prompt-writing skill**: Claude writes the prompts and settings, Higgsfield renders |
| **Canva** | Social posts, logos, thumbnails, infographics in your brand colours | Customize → Connectors → Canva |
| **NotebookLM** | Sources, decks, mind maps and videos generated on autopilot | A community repo's skill + scripts in Claude Code. You may need to allow *bypass permissions* in Settings → Claude Code and sign in to Google |
| **ElevenLabs** | A **voice support agent** trained on your FAQ, embedded on your site | Built with Claude Code: system prompt + knowledge base + tools (custom MCP possible) |
| **Firecrawl** | Heavy-duty scraping: scrape, map, multi-page crawl to Markdown, browser automation | Claude Code installs the CLI and authenticates. It adds about 29 skills. Built-in web search is fine for light lookups only |
| **Notion** | Create pages and databases, and fill them from web research | The Notion connector. Unlike Notion's own agents, it's included in your Claude plan with no extra Notion AI limits |
| **Google Stitch 2.0** | AI UI design → high-fidelity screens + HTML/CSS, Figma export, redesigning existing sites | Add the **Stitch MCP server** so Claude Code can drive Stitch |

## Takeaways

- **Built-in tools cover the light cases** (web search, official connectors). For heavy or specialised work, a dedicated tool plus an MCP server or skill does much better.
- **Claude Code is the installer**: one prompt with a repo URL replaces a manual setup.
- **Skills carry the expertise**, such as how to write a great image or video prompt, so the integration stays good every time.
