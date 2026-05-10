---
title: "Day 24"
date: "2026-05-10"
excerpt: "migrated Shirimono's backend from Render to Hetzner with Kamal — saved ~$60/month"
author: "Tony Duong"
category: "daily"
tags: ["devops", "rails", "kamal", "hetzner", "shirimono"]
coverImage: ""
---

## Today, I:

- migrated [Shirimono](https://shirimono.fun)'s backend from Render to a single Hetzner CPX21 VPS using Kamal — wrote [Saving ~$60/month by moving from Render to Hetzner with Kamal](/en/posts/saving-60-dollars-a-month-by-moving-from-render-to-hetzner-with-kamal) about why I switched, what the new single-host setup looks like (web + Solid Queue + Postgres on one box, no Redis), the cost breakdown, and the four gotchas that ate most of the cutover window: Kamal service names with underscores breaking `DATABASE_URL` parsing, Postgres 18's new data-directory layout, the trailing-newline trap when uploading `RAILS_MASTER_KEY` to GitHub Secrets, and Rails' `HostAuthorization` rejecting kamal-proxy's health checks
