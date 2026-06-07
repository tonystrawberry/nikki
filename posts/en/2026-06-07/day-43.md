---
title: "Day 43"
date: "2026-06-07"
excerpt: "Organized ~120 Datadog monitors (naming, tagging, categories) and added per-job error alerts, finally finished the last chapter of DDIA, and watched videos on deliberate success and minimalist living."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "learning", "productivity", "minimalism", "philosophy", "datadog", "monitoring", "observability", "ddia", "reading", "distributed-systems"]
coverImage: ""
---

## Today, I:

- watched [Success Is Not About Trying Hard](/en/posts/success-is-not-about-trying-hard) — a reflection on how success comes from deliberate consistency mixed with randomness, intuition, and reflection rather than brute effort, with practical examples (acing multiple-choice exams by drilling questions, video games, and running a YouTube channel)
- watched [Why I Live a Simple Minimalist Life](/en/posts/why-i-live-a-simple-minimalist-life) — Theo, a former jeweller who now owns 9.6 kg of possessions and lives by volunteering in gardens for board and keep, on how shedding things (and his heavy keyring) brought him hope, joy, and being at peace with his own integrity
- at work, organized all ~120 existing Datadog monitors — fixed inconsistent naming (mix of English/Japanese, some overly verbose), added tagging to flag which ones the BE team should watch, and introduced categories (ANOMALY, LATENCY, etc.); also added new monitors, including one that alerts when the error count *per job* exceeds a threshold so we can immediately pinpoint the failing job — learned a lot about Datadog monitoring along the way
- finally finished reading the last chapter of *Designing Data-Intensive Applications* — [DDIA Chapter 12: The Future of Data Systems](/en/posts/ddia-chapter-12-the-future-of-data-systems) — which wraps up the entire book; a huge milestone after months of working through it
