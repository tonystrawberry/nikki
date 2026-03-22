---
title: "Books That Made Me A CRACKED Backend Dev"
date: "2026-03-19"
excerpt: "Video listing seven books that helped level up backend skills: Clean Code, The Pragmatic Programmer, DDIA, System Design Interview, Database Internals, Release It, and Fundamentals of Software Architecture."
author: "Tony Duong"
category: "note"
tags: ["books", "backend", "career", "software-engineering", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=ReNqPp3EmYk"
---

## Overview

A video arguing that **books are the most underused resource** for learning software engineering—when something breaks, most people go to ChatGPT or Claude instead of a book. The presenter shares **seven books** that helped them level up their backend skills.

## The seven books

1. **Clean Code** by Robert C. Martin (Uncle Bob) — Focus on naming, readability, and the idea that we spend far more time reading code than writing it (ratio ~10:1). Messy code costs hours every week. A whole chapter on naming things.

2. **The Pragmatic Programmer** by Hunt & Thomas — No syntax, no frameworks; a 1999 book that reads like a manual for how modern engineers work (version control, automation, CI/CD before they were mainstream). Introduces DRY and timeless practices.

3. **Designing Data-Intensive Applications (DDIA)** by Martin Kleppmann — Described as the "backend bible." Explains *why* databases behave the way they do when things go wrong—not how to use PostgreSQL or Cassandra, but how they actually think. After reading it, distributed systems become readable instead of guesswork.

4. **System Design Interview** by Alex Xu — Interview prep that doubles as a systems architecture playbook. One chapter (e.g. newsfeed architecture) can give the mental model needed to fix real performance bottlenecks at work.

5. **Database Internals** by Alex Petrov — Most backend devs touch a database every day without knowing how it works under the hood. Covers B-trees, storage engines, consensus algorithms. Once you understand why PostgreSQL defaults to a B-tree index instead of a hash index, you stop writing slow queries by accident. Core idea: every database is solving three problems—how to store data, how to retrieve it, and how not to lose it.

6. **Release It** by Michael Nygard — Not about writing code but about what happens when code runs in production. Why do cascading failures happen? Introduces patterns like circuit breakers and bulkheads so one broken service doesn't drag down the entire system.

7. **Fundamentals of Software Architecture** by Mark Richards & Neil Ford — For when you stop just writing code and start asking why the system is built the way it is. Covers microservices, event-driven architecture, layered systems, and the trade-offs between them.

## Key takeaways

- Books are an underused, high-leverage resource for backend and systems skills.
- Clean Code and The Pragmatic Programmer build habits (naming, DRY, tooling) that compound over time.
- DDIA and Database Internals explain *why* systems behave the way they do, reducing guesswork.
- System Design Interview and Fundamentals of Software Architecture bridge coding and architecture.
- Release It addresses production resilience and failure modes.
