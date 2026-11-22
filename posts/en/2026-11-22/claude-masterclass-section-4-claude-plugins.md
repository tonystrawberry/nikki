---
title: "Claude Masterclass · 4: Claude Plugins"
date: "2026-11-22"
excerpt: "If a skill is a recipe, a plugin is the chef: a package of skills, commands and MCP connectors for one job, installed in one click. How to use, customize, import and build plugins."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-plugins", "claude-skills", "mcp", "udemy"]
collection: "claude-masterclass"
collectionOrder: 4
collectionTitle: "Claude Masterclass (Udemy)"
---

## TL;DR

A **plugin** packages everything Claude needs for one workflow (skills, slash commands, MCP connectors and configuration) and installs in one click. The course's analogy: **a skill is a recipe, a plugin is the chef** who knows many recipes and has the right tools connected.

| | Skill | Plugin |
|---|---|---|
| What | Step-by-step instructions for one task | Installable bundle for a whole domain |
| Contains | `SKILL.md` (+ refs, scripts) | Skills + commands + MCP servers + config |
| External data | None needed | Live connections to apps |
| Sharing | Upload a file | Marketplace, versioned, team-deployable, scoped permissions |

"The skill is the brain, the plugin is the body."

## Using a plugin

Go to **Customize → Plugins**, pick one (for example *Customer support*) and read its description and its **"Try asking"** examples. Trigger it with its **commands**. The side panel shows which command and connector it used.

## Customizing a plugin

1. ⋯ → **Show in folder** opens the plugin's `commands/` and `skills/` folders, where you edit, add or delete files. You have to **restart Claude** after deleting anything.
2. The **Customize** button opens a chat. Start with "first list all the commands and skills this plugin has", then tailor it to your company.

## Importing plugins

Use **Add plugin** and pick one of:
- **Browse plugins** (Anthropic's), including the **Personal** tab.
- **Upload plugin** (drag and drop a file).
- **Add marketplace from GitHub or URL**: paste a repo URL or a marketplace JSON, then **Sync**. Example: a finance-analysis plugin from a public repo.

## Building one

The simplest route is to say "Please create a plugin for me" and Claude walks you through the skills and commands. The course also ships a form-style helper that writes the prompt for you: name, purpose, users, category, and 2–3 skills each with a trigger, instructions and output format.

## Anthropic plugins worth a look

**Data** (interactive HTML dashboards and data Q&A), **Marketing**, **Customer support**, **HR**, **Engineering**, **Operations** and **Sales**.

## Exercise

Design a plugin around a **theme**, not a single task. For example, a content plugin with draft-article, repurpose-content and write-hook skills. Explain why those skills belong together.
