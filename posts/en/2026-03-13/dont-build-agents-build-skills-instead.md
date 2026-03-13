---
title: "Don't Build Agents, Build Skills Instead"
date: "2026-03-13"
excerpt: "Notes on Anthropic's talk about agent skills — organized folders that package composable procedural knowledge, complementing MCP servers in the emerging general agent architecture."
author: "Tony Duong"
category: "note"
tags: ["ai", "claude", "agents", "skills", "mcp"]
youtubeUrl: "https://www.youtube.com/watch?v=CEvIs9y1uog"
---

## Overview

Barry Zhang and Mahesh Murag from Anthropic present **agent skills** — a new paradigm for extending general-purpose agents like Claude Code. Instead of building separate agents for each domain, they argue we should build **skills**: organized folders of procedural knowledge that any agent can pick up and use.

## The Problem: Intelligence Without Expertise

Agents today are like a 300 IQ genius with no domain experience. They can figure things out from first principles, but you don't want that for your taxes — you want a domain expert who executes consistently.

Current agents:
- Are brilliant but lack expertise
- Can do amazing things with enough guidance, but miss important context upfront
- Can't absorb your expertise well
- Don't learn over time

## What Are Skills?

Skills are **organized collections of files that package composable procedural knowledge for agents**. In practice: they're folders.

This simplicity is deliberate:
- Anyone (human or agent) can create and use them
- They work with existing tools — version in Git, share via Google Drive, zip and send
- They can include scripts as tools alongside instructions

### Why Files Over Traditional Tools?

Traditional tools have problems:
- Poorly written instructions, ambiguous behavior
- When the model struggles, it can't modify the tool — it's stuck
- They always live in the context window

Code/files solve these issues:
- Self-documenting
- Modifiable by the agent
- Can live in the file system until needed

### Progressive Disclosure

Skills protect the context window through progressive disclosure:
1. At runtime, only **metadata** is shown (skill name/description)
2. When needed, the agent reads the **SKILL.md** with core instructions
3. Everything else (scripts, assets, examples) is organized in the folder for on-demand access

This allows fitting **hundreds of skills** while keeping them composable.

## Types of Skills

### Foundational Skills
General or domain-specific capabilities the agent didn't have before.
- **Document skills** (by Anthropic): create/edit professional Office documents
- **Scientific research skills** (by Cadence): EHR data analysis, bioinformatics libraries

### Third-Party Skills
Partners building skills for their own products:
- **Browserbase/Stagehand**: browser automation and web navigation
- **Notion**: deep research over your entire workspace

### Enterprise Skills
Company and team-specific skills:
- Teaching agents organizational best practices
- Developer productivity teams deploying to thousands of developers
- Encoding code style, internal tooling knowledge, and workflows

## The Emerging General Agent Architecture

The architecture is converging on:

1. **Agent loop** — manages internal context and token flow
2. **Runtime environment** — file system + ability to read/write code
3. **MCP servers** — tools and data from the outside world (connectivity)
4. **Skills library** — hundreds/thousands of skills pulled into context on demand (expertise)

**MCP provides the connection; skills provide the expertise.**

Giving an agent new capabilities in a new domain = equipping it with the right MCP servers + the right skills.

## Future Directions

### Skills as Software
As skills get more complex (packaging executables, binaries, assets), they need:
- **Testing and evaluation** — measuring output quality
- **Trigger tooling** — ensuring skills load at the right time for the right task
- **Versioning** — tracking behavior changes over time
- **Dependencies** — skills referring to other skills, MCP servers, or packages

### Continuous Learning
Skills are designed as a concrete step towards continuous learning:
- Anything Claude writes down can be used by a future version of itself
- Memory becomes tangible — capturing procedural knowledge for specific tasks
- Claude can acquire, evolve, and drop skills as needed
- Goal: Claude on day 30 is much better than Claude on day 1

### Sharing and Distribution
The most exciting vision: a **collective, evolving knowledge base** curated by people and agents:
- New team members get an agent that already knows the team's practices
- Community-built skills make everyone's agents more capable
- Similar to how community MCP servers benefit all agents

## The Computing Analogy

| Computing | AI |
|-----------|-----|
| Processors | Models |
| Operating Systems | Agent runtimes |
| Applications | Skills |

A few companies build processors and OSes, but millions of developers build applications. Skills open up this "application layer" for everyone.

## Key Takeaways

1. **Code is the universal interface** — Claude Code is actually a general-purpose agent, not just a coding tool
2. **Skills = folders** — deliberately simple so anyone can create and share them
3. **Progressive disclosure** protects context window while enabling hundreds of skills
4. **MCP + Skills** are complementary — MCP for connectivity, skills for expertise
5. **Stop rebuilding agents** — the agent is universal; customize it with skills instead
6. **Skills enable continuous learning** — agents that get better the more you use them
