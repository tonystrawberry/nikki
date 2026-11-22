---
title: "Claude Masterclass · 2: Claude Skills, the basics"
date: "2026-11-22"
excerpt: "A skill is a recipe: a SKILL.md (plus optional scripts and references) that teaches Claude to do a task your way, every time. Here's how to use, create, edit and find skills."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-skills", "prompting", "udemy"]
collection: "claude-masterclass"
collectionOrder: 2
collectionTitle: "Claude Masterclass (Udemy)"
---

## TL;DR

Claude already knows how to do most tasks, just not **your** way. A **skill** is an onboarding guide written in plain language: steps, quality bar, format, tone and expertise. Claude plus a skill gives you an on-demand expert with **consistent** output, and a skill can be shared with a team.

## Using skills

- Go to **Customize → Skills** and toggle on the Anthropic skills you want (canvas design, doc co-authoring, and so on).
- To import a skill, click **+ → Upload** and drag in the `.md`, `.zip` or folder.
- The course gives away a pack of 20+ skills, such as a hook engineer, notes→PowerPoint, a CTA optimizer and a document converter.

## Anatomy of a skill

```text
my-skill/
├── SKILL.md        # required: role, logic, decision rules, workflow
├── scripts/        # optional: Python to process data, call APIs…
└── references/     # optional: guides, examples, domain docs
```

The only thing you need is `SKILL.md`. Its frontmatter `description` is what tells Claude what the skill is for and when to use it.

## Three ways to create one

1. **Skill Creator**: Anthropic's own skill for building skills. You chat, attach references and it asks questions. No code, and the easiest route.
2. **Manual**: write `SKILL.md` and the folders yourself, then upload.
3. **Claude Code**: build it in your project's `.claude/skills/` (Section 3).

Template for turning a document into a skill (paraphrased):

```text
Review <document name>, which I've attached, and turn it into a reusable
Claude skill that <goal>.
Before starting, check that every brand/context file needed is included;
if key details are missing, pause and ask me short, specific questions.
Follow the document's step-by-step process strictly.
Use the skill-creator skill so the structure and format are correct.
```

Tip: ask Claude to *fill in the template only, not create the skill yet*. Otherwise it sometimes runs a skill to make another skill.

## Editing a skill

- In chat, say "Update my `<skill-name>` skill with this file…". In a new conversation, name the skill explicitly.
- Or use ⋯ → **Download**, edit the files and re-upload.

## Example: "world news" skill

Built through the chat. Skill Creator asked about topics, format and number of articles, then **ran evals with and without the skill**, scoring **93% vs 55%** pass rate.

## Where to find skills

skillhub.club, skillsmp and similar marketplaces, some of them paid. Skills from the internet sometimes need adapting, so ask Claude to "make this skill compatible with Claude".

## Exercises
1. Turn on a built-in skill and use it.
2. Create your first skill with whichever method you like.
3. Optionally, build three skills, one per method.
