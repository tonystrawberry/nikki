---
title: "Day 63"
date: "2026-08-12"
excerpt: "Learned Ruby’s and vs && precedence, multithreading for IO-bound Rails work, truthiness of [] and \"\", and how threads, workers, processes, and the DB connection pool fit together."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "ruby", "rails", "multithreading", "performance", "connection-pool", "puma"]
coverImage: ""
---

## Today, I:

- learned about Ruby's `and` vs `&&` — same boolean idea, but different precedence (`&&` binds tighter than `and`, so mixing them in assignments/conditionals can surprise you)
- learned about multithreading in Rails for IO-bound work (HTTP requests, file reads) from [this Medium post](https://medium.com/@mustajabzaheer51/multithreading-in-ruby-on-rails-a-10-performance-boost-5fc3aa914dca) — can speed those up in-process instead of always shipping them to async jobs
- reminded myself that in Ruby ternary / conditionals, `[]` and `""` are truthy — everything is an object, and only `nil` and `false` are falsy
- (re)learned how threads, workers, processes, and the DB connection pool relate — wrote it down simply in [Rails Threads, Workers, Processes, and the DB Connection Pool (ELI5)](/en/posts/rails-threads-workers-processes-and-connection-pool)
