---
title: "Claude Masterclass · 8: Using the Claude app"
date: "2026-11-22"
excerpt: "The optional basics chapter: plans, which model to use when, how LLMs work, custom instructions, Projects, memory, artifacts, the prompt formula, and how Claude reads files and images."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "prompting", "llm", "artifacts", "udemy"]
collection: "claude-masterclass"
collectionOrder: 8
collectionTitle: "Claude Masterclass (Udemy)"
---

## TL;DR

The course marks this chapter optional: it's a tour of claude.ai itself. The useful parts are picking the right model, putting context into **Projects** and **custom instructions**, turning on **memory**, building **artifacts**, and using a simple prompt formula.

## Plans

| Plan | Price | For |
|---|---|---|
| Free | $0 | Trying it out: tight limits, no Projects |
| **Pro** | $20/mo ($17/mo billed yearly) | Most daily users: unlimited Projects, Claude Code, Cowork |
| Max | from $100/mo | Heavy users: higher limits, early features, priority |
| Team / Enterprise / API | — | Organisations and developers |

## Which model?

- **Haiku**: fastest and cheapest. Quick Q&A, high-volume or real-time tasks.
- **Sonnet**: the default, with the best balance. Writing, research, code and docs; about 90% of tasks.
- **Opus**: deep reasoning, for when the result really matters.

## How an LLM works, briefly

A neural network trained on huge amounts of text. It **predicts the most useful next tokens**; it doesn't "understand" or look things up. Everything you send, including uploaded files, becomes tokens inside a limited **context window**.

## Custom instructions

**Settings → General → instructions/preferences** apply to every chat. For example: "Give clear, structured answers. Focus on practical use cases."

## Projects

A Project is a folder of chats with shared **files**, **instructions** and **memory**: for example a "Marketing" project holding your guides. You can move an existing chat into a project with ⋯ → *Add to project*.

Quick test that the instructions are applied: add "end every answer with `[test]`".

## Memory

**Settings → Capabilities → Memory** has two options: *search and reference past chats* and *generate memory from chat history*. Both cover chats and projects. It works like retrieval (RAG), a notebook Claude looks things up in. Start a new chat when you want a clean slate.

## Artifacts

Interactive things Claude builds right in the chat: dashboards, web apps, games, flashcards, converters. The demos were a SaaS KPI dashboard (revenue, growth, funnel) and a "prompt generator" app, each done in about two prompts and then refined.

## The prompt formula

**Role + Task + Context + Format = result**

```text
Act as a senior content marketer.                        # role
Write a 1,200-word blog post on <topic>, step by step:   # task
outline, intro, 3 sections, CTA.
Here are 3 past articles so you match my tone: <files>.  # context
Return it as a document artifact with H2 headings.       # format
```

For long pieces, ask for the outline first, then expand each part. For anything you repeat, make it a **skill** instead.

## Files, vision and voice

Uploaded PDFs, CSVs and DOCX files are **converted to text and tokenized** into the context, just like a long message. Scanned PDFs are images, and very large files can be **truncated** if they go past the context window. Claude also reads images and supports voice input.
