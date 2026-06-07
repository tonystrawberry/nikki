---
title: "Day 23"
date: "2026-04-15"
excerpt: "wrote an article about a lost update bug in spacely_web that had been unsolved for years"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "rails", "concurrency", "mysql", "rspec"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Today, I:

- wrote [Lost Updates in a Rails App: What Broke, How We Fixed It, and How We Tested It](/en/posts/lost-updates-in-a-rails-app-what-broke-how-we-fixed-it-and-how-we-tested-it) about the lost update problem I encountered while fixing a bug in `spacely_web` that had been unsolved for years — covered what a lost update is, why MySQL InnoDB's REPEATABLE READ doesn't save you from read-modify-write on a JSON column, how two parallel jobs each merging a different key into `WorkflowRun#progress` end up dropping one key, the `with_lock` fix we shipped, and a threaded RSpec setup using two `Queue`s to reproduce the race and show failing vs passing output
