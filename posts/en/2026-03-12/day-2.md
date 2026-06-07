---
title: "Day 2"
date: "2026-03-12"
excerpt: "Set up Keystatic CMS, fixed i18n redirects, picked up Rails and Claude Code tips, and read DDIA Chapter 2."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "keystatic", "cms", "nextjs", "i18n", "rails", "claude-code", "ddia", "databases"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Today, I:

- added Keystatic to the project to manage the blog posts. It's a headless CMS that allows us to manage the blog posts from a central location. Not sure if I am going to use it because there is no AI integration yet.
- fix a redirection problem when visiting a post in a different language than the one it's written in.
- learned about **compound engineering** — the practice of making small, consistent improvements that accumulate into significant gains over time, like compound interest. Each improvement builds on the last, so the value grows exponentially rather than linearly.
- watched [How a Meta Staff Engineer Uses Claude Code](https://www.youtube.com/watch?v=mZzhfPle9QU) by John Kim — 50 tips on moving from manual coding to agentic orchestration with Claude Code. I wrote [my notes](/en/posts/how-a-meta-staff-engineer-use-claude-code) on it.
- learned that in Rails, columns used with `dependent: :nullify` on destroy should have a database index to accelerate the queries that update those rows. For example, if a `User` has many `comments` with `dependent: :nullify`, destroying a user runs `UPDATE comments SET user_id = NULL WHERE user_id = ?` — without an index on `comments.user_id`, this triggers a full table scan
- learned that placing `CLAUDE.md` files in specific subdirectories rather than only at the root can save tokens — rules that only apply to a subset of files (e.g. `app/controllers/CLAUDE.md` for parameter validation patterns or the comment convention specifying the HTTP operation and path above each method) are only loaded when Claude works in that folder
- had an off day — made too many easy mistakes, mostly code not matching the specs. Tomorrow will be better
- read Chapter 2 of *Designing Data-Intensive Applications* — data models and query languages. I wrote [my notes](/en/posts/ddia-chapter-2-data-models-and-query-languages) on it
