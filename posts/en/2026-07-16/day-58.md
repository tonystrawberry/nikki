---
title: "Day 58"
date: "2026-07-16"
excerpt: "Read chapter 8 of Practical Object-Oriented Design in Ruby (composition), and built an n8n workflow that posts a daily Japanese kanji lesson to social media."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "ruby", "object-oriented-design", "poodr", "composition", "n8n", "automation", "workflow", "ai", "japanese", "kanji"]
coverImage: ""
---

## Today, I:

- read chapter 8 of POODR and wrote up a summary: [Combining Objects with Composition](/en/posts/poodr-chapter-8-composition)
- used [n8n](https://n8n.io) to build an automated workflow that posts educational Japanese kanji lessons to social media (Facebook, Instagram, Threads) every day: a weekly job generates the caption and a styled image with Google Gemini into a Google Sheet, then a daily job publishes the next unposted row to all three platforms — wanted to try n8n since it's currently the leader in the AI workflow automation market ([repo](https://github.com/tonystrawberry/shirimono-n8n-daily-post))
