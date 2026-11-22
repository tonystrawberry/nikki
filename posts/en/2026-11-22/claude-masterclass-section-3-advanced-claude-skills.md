---
title: "Claude Masterclass · 3: Advanced Claude Skills"
date: "2026-11-22"
excerpt: "Designing skills properly: why they beat projects and automations, how to write the description and instructions, the three tests, folder structure, and building one by hand in Claude Code."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-skills", "claude-code", "prompting", "udemy"]
collection: "claude-masterclass"
collectionOrder: 3
collectionTitle: "Claude Masterclass (Udemy)"
---

## TL;DR

Section 2 was about using the Skill Creator. This section is about **designing** skills yourself: good frontmatter, clear instructions, a clean folder structure and real tests. The section is built on Anthropic's 33-page skills guide.

## Why skills?

- **Projects and custom GPTs** are tied to one context and one project.
- **n8n and Make** automations are deterministic and hard-coded.
- **Skills** are flexible, and an agent can load **thousands** of them, each pulled in only when needed. They can also **improve themselves**: every output you approve gets saved as a good example.

## The frontmatter decides when the skill fires

Claude keeps only `name` and `description` in memory at all times, so they're the skill's first impression.

```yaml
---
name: csv-data-pipeline          # kebab-case
description: Cleans, validates and transforms CSV files. Use when the
  user uploads a .csv or asks to clean, dedupe or reformat tabular data.
---
```

- ❌ `Helps with projects.` matches everything.
- ✅ Say **what it does** and **when to use it**, with trigger words and file types: "Analyzes Figma files and generates dev handoff docs. Use when the user uploads a .fig or asks for design specs."

Instructions should be specific steps with explicit rules and the output format, not vague advice.

## Test it three ways

| Test | Question | How |
|---|---|---|
| Trigger | Does it activate when it should? | **Fresh session**, with prompts that should and shouldn't trigger it |
| Functional | Is the output correct and consistent? | Run it 4–5 times with slightly different inputs |
| Value | Is it worth being a skill? | Weigh complexity against benefit; not everything needs to be a skill |

If it **under-triggers**, add trigger words. If it **over-triggers**, make the description narrower.

## Folder structure

```text
❌ my-skill/
   └── SKILL.md            # everything crammed in one file

✅ csv-data-pipeline/
   ├── SKILL.md            # always loaded first
   ├── references/
   │   └── column-types.md # loaded on demand
   └── scripts/
       └── clean.py        # run only when needed
```

Splitting the files keeps `SKILL.md` focused and **saves context**, because references are only read when Claude needs them.

## Building one by hand in Claude Code

The demo builds an **email-draft writer** in VS Code with no Skill Creator:

```text
.claude/
└── skills/
    └── email-draft-writer/
        ├── SKILL.md
        └── references/
            ├── examples.md
            └── tone-guidelines.md
```

- Note the leading dot in `.claude`.
- This skill is instructions only, so it has no `scripts/`.
- To edit it, open `SKILL.md` directly; it's just Markdown. Adding trigger words to the description is the most common fix.
- To add a tone or template, create a new reference file and **link it from SKILL.md**.

## Exercise

Build a skill for a real daily pain point, such as meeting notes → summary with action items, or raw numbers → weekly report. Pick a design pattern, create `SKILL.md` + `references/` with at least one reference, then **try to break it**.
