---
title: "How a Meta Staff Engineer Uses Claude Code: 50 Tips for Agentic Development"
date: "2026-03-12"
excerpt: "John Kim's comprehensive guide to moving from manual coding to agentic orchestration with Claude Code — covering setup, power commands, and advanced workflows."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude-code", "ai", "productivity", "engineering", "workflow"]
youtubeUrl: "https://www.youtube.com/watch?v=mZzhfPle9QU"
---

John Kim, a Staff Engineer at Meta, shared a comprehensive guide with 50 tips on how to move from manually writing code to fully leveraging Claude Code as an **agentic orchestrator**. Here are all the tips, organized by topic.

> Original video: [How a Meta Staff Engineer Uses Claude Code](https://www.youtube.com/watch?v=mZzhfPle9QU)

---

## Foundations & Setting Up

1. **Run in Root** — Always launch Claude in the root directory of your project to ensure it picks up the correct context and rule files.
2. **Use `/init`** — Run this on every new project. Claude will analyze your architecture and generate a tailored `CLAUDE.md` automatically.
3. **Hierarchy of Memory** — Claude uses a hierarchy: local project memory first, then global user memory (`~/.claude/`), then built-in system instructions.
4. **Keep Rules Concise** — Aim for ~300 lines in your `CLAUDE.md`. Bloat leads to higher token costs and less accurate behavior.
5. **Technical Architecture** — Include high-level technical requirements and domain context in your rules file.
6. **Design Patterns** — Explicitly state which design patterns your project follows to keep the AI consistent across sessions.
7. **Validation Loops** — The most important foundation: define build and validation commands so the AI can self-correct when code fails to compile, without human intervention.

---

## Keyboard Shortcuts

8. **Toggle Modes (`Shift + Tab`)** — Switch between Plan Mode (architecting) and Accept Edits (execution) instantly.
9. **Escape to Interrupt** — If Claude is "thinking" but going off-track, hit `Escape` to stop it immediately and redirect.
10. **Prompt Queueing** — Don't hesitate to enter multiple prompts in a row; Claude Code logically queues and de-dupes them.
11. **Clear Input (Double-tap Escape)** — Instantly clears a large copy-pasted block or long prompt from your input field.
12. **Rewind Context (Escape on empty input)** — Rewinds to a previous point in the conversation and restores that context.
13. **Vim Mode** — If you're a Vim user, enable this for more efficient terminal navigation.
14. **Screenshot Drop** — Drag and drop screenshots directly into the terminal to provide visual context for UI debugging.

---

## Essential Slash Commands

15. **`/clear`** — Wipe the current context window when starting a new feature to prevent stale information from influencing the AI.
16. **`/context`** — Visual audit of exactly which files and tokens are currently in Claude's context window.
17. **Audit for Bloat** — Use `/context` specifically to spot MCPs or files eating up too many tokens unnecessarily.
18. **Auto-Compaction** — Let Claude auto-compact long sessions to keep the context window fresh and relevant.
19. **`/models`** — Switch between Sonnet, Haiku, or Opus. Kim recommends Opus as the default for high-level architectural work.
20. **`/resume`** — If you accidentally kill a terminal instance, use this to recover your conversation and context.
21. **`/mcp`** — View and manage your Model Context Protocol extensions.
22. **Limit MCPs** — Only install MCPs necessary for the specific project to avoid unnecessary token bloat.
23. **`/help`** — Use the built-in wizard to discover new commands as Claude Code gets updated.
24. **Git Safety Net** — Use Git as your primary safety net for code changes rather than relying solely on the internal rewind feature.

---

## Managing Rules (CLAUDE.md)

25. **Top-to-Bottom Priority** — Order your rules from most important to least important; Claude reads them sequentially.
26. **"Never Do" vs. "Always Do"** — Use explicit negative and positive constraints to define clear guardrails.
27. **Code Snippets** — Provide clear examples of your project's unique DSL or archaic patterns so Claude doesn't invent alternatives.
28. **Auto-Update Rules** — Instead of editing `CLAUDE.md` manually, tell Claude: *"Update the rules so we never make this mistake again."*
29. **Trigger Words** — Set up keywords in your rules that trigger specific skills or build commands automatically.
30. **Compound Engineering** — Commit your `CLAUDE.md` to the codebase to share AI best practices with your entire team.
31. **Vibe Check Evaluations** — AI evals are hard to quantify. Test rule changes for a few weeks before merging them into the main branch.

---

## Advanced Workflows

32. **Dangerously Skip Permissions** — Use `--dangerously-skip-permissions` to let Claude edit files without asking for approval. Use with extreme caution and only in throwaway environments.
33. **`/permissions`** — Explicitly define which destructive actions (like `rm -rf`) still require manual approval even in skip mode.
34. **Start in Plan Mode** — Always spend time arguing with Claude in Plan Mode before letting it write a single line of code.
35. **The "Starcraft" Workflow** — Open multiple Claude instances in different terminal tabs and juggle them to work on several features simultaneously.
36. **Fresh Beats Bloated** — Always prefer a fresh, condensed context over a long, circular conversation with stale history.
37. **The "Second Brain"** — Save session summaries to a local directory and lazy-load them into new sessions to preserve architectural decisions across days.
38. **Lazy Load To-Dos** — Keep your project to-do list in a local index and only ask Claude to read it when needed — don't bloat every session with it.
39. **Control the Emulator** — Ask Claude to control your mobile emulator, add debug logs, and read traces through MCPs.
40. **Web Navigation with `/chrome`** — Have Claude navigate documentation sites or fill out forms via a headless browser when no API is available.

---

## Power User Composability

41. **Create Skills** — Turn any recurring workflow into a reusable skill by telling Claude: *"Save what we just did into a new skill."*
42. **Skills are MD Files** — Skills are just system prompts saved in a specific directory. You can open and edit them as plain text.
43. **Extend Skills** — Ask Claude to *"extend this skill"* to handle new sources (e.g., adding Twitter to an existing Hacker News skill).
44. **Sub-Agents for Side Effects** — Use sub-agents for atomic tasks that don't need full project context, keeping your main window clean.
45. **Avoid Sub-Agent Overuse** — Don't use sub-agents for tasks requiring deep architectural knowledge; they don't share the main context window.
46. **Juggling iTerm2 Instances** — Use `Cmd + D` and `Cmd + [ / ]` to switch between multiple Claude sessions rapidly.
47. **Rename Tabs** — Rename your terminal tabs (e.g., "Local," "Remote SSH") to stay oriented across many parallel agents.
48. **Audio Notifications** — Tell Claude to "ring a bell" or use text-to-speech to summarize what it did when a background task finishes.
49. **Git Worktrees** — Use Git worktrees to work on different branches in parallel without code conflicts between sessions.
50. **Explore the Ecosystem** — Download community-made plugins and MCPs to extend Claude's capabilities beyond the defaults.

---

## My Takeaways

The throughline across all 50 tips is **reducing the feedback loop** between intention and result. Whether it's validation loops, the Second Brain, or the Starcraft workflow — every pattern is about getting Claude to handle more of the cycle autonomously.

The tips I'm applying immediately:
- Define build and lint commands in `CLAUDE.md` so Claude validates its own output
- Use `/context` to audit token usage and trim bloat
- Start every complex task in Plan Mode before touching code
- Save session summaries locally to resume multi-day work without losing context
