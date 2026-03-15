---
title: "How I Made a 24/7 AI Employee with Claude (Scheduled Tasks and Loops)"
date: "2026-03-15"
excerpt: "Notes on running Claude 24/7 via two methods: /loop in Claude Code (interval-based, technical) and Scheduled Tasks in the cloud desktop (set-and-forget, no-code)."
author: "Tony Duong"
category: "note"
tags: ["ai", "claude", "agents", "automation", "scheduled-tasks", "loops"]
youtubeUrl: "https://www.youtube.com/watch?v=Mf63K5LFivI"
---

## Overview

Claude can act as a **24/7 AI agent** that completes tasks while you sleep: morning messages, monitoring, and end-of-day reports. The video covers two ways to run Claude on a schedule: **loops** (technical, in Claude Code) and **scheduled tasks** (no-code, in the Claude cloud desktop app).

## Method 1: Loops (Claude Code)

- **What it is:** The `/loop` command in Claude Code runs a task on a fixed **interval** (minimum 1 minute, maximum 3 days).
- **Where it runs:** Inside your **cloud Code session**. As long as that terminal/session is open, the loop keeps running.
- **Use cases:**
  - Check if a deployment finished and report back.
  - One-time reminders (e.g. “remind me at 3 p.m. to push the release branch”).
  - “In 45 minutes, check whether integration tests have passed.”
  - **Recurring monitoring:** e.g. monitor a Slack channel (e.g. “competitor research”), and every 1 minute look up new company names, do brand/product research, and print a short analysis in the chat.
- **Flow:** You give `/loop` an interval and a natural-language prompt; Claude turns it into a **cron-style job** that runs in the background and can use tools (e.g. web search, Slack) while you work on something else.

## Method 2: Scheduled Tasks (Cloud Desktop)

- **What it is:** **Set-and-forget** tasks in the **Claude cloud desktop app**. No terminal or code required.
- **Use cases:**
  - **Daily morning brief:** “Summarize my inbox from the last 24 hours into a short morning brief with the date on top, ~2 minutes to read. Save to the folder I’m running in. Run every weekday at 8:30 a.m.”
  - **Calendar summary:** Read your calendar and summarize the day’s events.
  - **Team updates:** Summarize what went on and send a briefing to someone.
- **Options:** You can set frequency (daily, weekdays only, etc.), time, output location (e.g. save to a folder), and model (e.g. Sonnet). You can “run now” or wait for the schedule.

## Key Takeaways

- **Loops** = in-session, interval-based co-pilot (1 min–3 days) for technical users in Claude Code; great for deployments, reminders, and recurring checks (e.g. Slack monitoring).
- **Scheduled tasks** = calendar-style, no-code automation in the cloud desktop; great for daily briefs, calendar summaries, and team updates.
- **Mindset shift:** Use Claude **proactively** with schedules and workflows that run 24/7, instead of only going to it when you have a problem.
