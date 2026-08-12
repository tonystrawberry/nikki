---
title: "日次 63"
date: "2026-08-12"
excerpt: "Rubyの and と && の優先順位、IOバウンドなRails作業向けマルチスレッド、[] と \"\" がtruthyなこと、threads / workers / processes / connection pool の関係を学んだ。"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "ruby", "rails", "multithreading", "performance", "connection-pool", "puma"]
coverImage: ""
---

## 今日やったこと：

- Rubyの `and` と `&&` の違いを学んだ — ブールの意味は同じだが優先順位が違う（`&&` の方が `and` より強く結合するので、代入や条件で混ぜるとびっくりする）
- RailsでIOバウンドな処理（HTTPリクエスト、ファイル読み込み）向けのマルチスレッドを [このMedium記事](https://medium.com/@mustajabzaheer51/multithreading-in-ruby-on-rails-a-10-performance-boost-5fc3aa914dca) で学んだ — いつもasyncジョブに投げる代わりに、プロセス内で速くできることもある
- Rubyの三項演算子 / 条件では `[]` と `""` がtruthyだと再確認 — すべてはオブジェクトで、falsyなのは `nil` と `false` だけ
- threads・workers・processes・DB connection pool の関係を（再）学習 — [Rails Threads, Workers, Processes, and the DB Connection Pool (ELI5)](/ja/posts/rails-threads-workers-processes-and-connection-pool) にやさしくまとめた

---

> 🌐 *Claudeによる翻訳*
