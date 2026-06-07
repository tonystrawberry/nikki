---
title: "Day 23"
date: "2026-04-15"
excerpt: "何年も解決されていなかった spacely_web の lost update バグについての記事を書いた"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "rails", "concurrency", "mysql", "rspec"]
coverImage: "/images/blog/daily-cover.jpg"
---

## 今日やったこと：

- 何年も未解決だった `spacely_web` のバグ修正中に出会った lost update 問題について、[Lost Updates in a Rails App: What Broke, How We Fixed It, and How We Tested It](/ja/posts/lost-updates-in-a-rails-app-what-broke-how-we-fixed-it-and-how-we-tested-it) を書いた — lost update とは何か、なぜ MySQL InnoDB の REPEATABLE READ が JSON カラムへの read-modify-write を救ってくれないのか、`WorkflowRun#progress` に異なるキーをマージする 2 つの並行ジョブがどのようにキーを 1 つ落としてしまうのか、リリースした `with_lock` での修正、そして 2 つの `Queue` を使ったスレッド付き RSpec で競合を再現し、失敗時と成功時の出力を見せる方法までを扱った

---
> 🌐 *Claudeによる翻訳*
