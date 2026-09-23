---
title: "Day 71"
date: "2026-09-23"
excerpt: "Rails OpenAPI gem write-up, SimpleCov patch coverage in CI, and Ego Is the Enemy — humility, learning from others, and not letting success inflate you."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "rails", "ruby", "openapi", "gem", "spacely", "presentation", "simplecov", "ci", "testing", "coverage", "reading", "ego", "humility"]
coverImage: ""
---

## Today, I:

- wrote an article/presentation about [rails-openapi-generator](https://github.com/tonystrawberry/rails-openapi-generator), the gem I made for Spacely — [rails-openapi-generator — Approach & Design](/en/posts/rails-openapi-generator-approach-and-design)
- used SimpleCov 1.2's new patch coverage feature — `bundle exec simplecov patch --base origin/develop --minimum 90 --no-color` — and integrated it into CI so every file changed in a PR must have ≥90% coverage
- read *L'ego est l'ennemi* (*Ego Is the Enemy*) — a lot of it I already knew, but I can see the traits the author describes in friends, in my mother sometimes, even in myself: stay humble, learn from others, don't let success change you or make you overconfident, don't get too attached to results, don't overrate yourself
