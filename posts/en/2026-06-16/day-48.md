---
title: "Day 48"
date: "2026-06-16"
excerpt: "Watched Boris Cyrulnik on decivilization and fixed Shirimono Apple auth after a Hetzner migration — PEM newlines stored as literal \\n."
author: "Tony Duong"
category: "daily"
tags: ["psychology", "parenting", "education", "family", "screens", "society", "shirimono", "apple", "authentication", "hetzner", "deployment", "debugging"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Today, I:

- watched [Family, School, Screens — Boris Cyrulnik's Warning](/en/posts/family-school-screens-boris-cyrulnik-warning) — on decivilization, the first 1000 days of childhood, screen time and depression, family ruptures, and reinventing rituals of empathy
- fixed Apple authentication for Shirimono — after migrating from Render to Hetzner and copying env vars, production `APPLE_PRIVATE_KEY` had a PEM with literal `\n` instead of real newlines; easy fix once found, but debugging was a chore
