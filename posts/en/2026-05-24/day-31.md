---
title: "Day 31"
date: "2026-05-24"
excerpt: "A Claude Code skill for Rails upgrades, the first half of a 6-hour Apache Spark deep-dive, and a streaming Claude-powered chat at /en/chat."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "rails", "spark", "big-data", "ai", "claude", "nextjs"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Today, I:

- discovered the [ombulabs/claude-code_rails-upgrade-skill](https://github.com/ombulabs/claude-code_rails-upgrade-skill) via Ruby Weekly — should be genuinely useful for the Rails 7.2 → 8.1 upgrade we're planning at Spacely
- watched [Apache Spark — The Ultimate Guide](/en/posts/apache-spark-the-ultimate-guide-from-zero-to-pro) up to 3:50:46 — Ansh Lamba's delivery is funny and conversational, like a buddy walking you through it, which makes a 6-hour course actually finishable; learned a lot about Spark already and will finish the rest tomorrow
- shipped a chat feature at [/en/chat](/en/chat) — a Next.js streaming API route that pipes Claude Sonnet 4.6 deltas straight to the browser via a `ReadableStream`, with the system prompt rebuilt per request from a curated persona Markdown file plus a digest of every post in the active locale (title, date, category, tags, excerpt), all wrapped in `cache_control: ephemeral` so follow-up turns hit the prompt cache; user messages get Zod-validated and react-markdown renders the streamed bubbles; not really a *digital clone* — more an LLM augmented with this site's content — and the same UI ships in fr and ja too
