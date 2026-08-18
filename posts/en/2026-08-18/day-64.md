---
title: "Day 64"
date: "2026-08-18"
excerpt: "Restarted at Spacely, dug into GVL and rack-mini-profiler, and admitted how much Rails magic I still need to learn."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "spacely", "freelance", "career", "ruby", "gvl", "concurrency", "rack-mini-profiler", "performance", "rails", "learning"]
coverImage: ""
---

## Today, I:

- restarted working for Spacely as a freelancer — had a nice long rest, but it's time to go back
- relearned about the GVL (Global VM Lock) — MRI only runs one thread of Ruby code at a time, but releases the GVL during blocking I/O (DB, HTTP, disk), so in a high-I/O Rails app many threads can still wait on I/O in parallel; CPU-bound work stays serialized unless you scale with processes
- used rack-mini-profiler on a project — really useful for request timing, SQL, and jbuilder render breakdowns in local Rails; used to reach for Datadog for this kind of data, but this is way more practical in development
- realized I've relied too much on Ruby and Ruby on Rails "magic" — parts like `ActiveSupport::Concern` were mystery; at work it was more about shipping features than the language/framework intricacies, so I decided to spend some time per day on learning more about the language and framework by chatting with LLM, reading articles, and reading the source code.
