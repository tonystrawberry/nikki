---
title: "Day 64"
date: "2026-08-18"
excerpt: "Spacelyのフリーランスを再開し、GVLとrack-mini-profilerを復習。Railsの「魔法」にまだ多くを頼りすぎていると気づいた。"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "spacely", "freelance", "career", "ruby", "gvl", "concurrency", "rack-mini-profiler", "performance", "rails", "learning"]
coverImage: ""
---

## 今日やったこと：

- Spacelyのフリーランスを再開 — しっかり休めたが、そろそろ戻る時期だった
- GVL（Global VM Lock）を復習 — MRIは一度に1つのRubyスレッドしか実行しないが、ブロッキングI/O（DB、HTTP、ディスク）中はGVLを解放するので、I/O多めのRailsアプリでは多くのスレッドが並行してI/O待ちできる；CPUバウンドな処理はプロセスでスケールしない限り直列のまま
- プロジェクトでrack-mini-profilerを使った — ローカルRailsでのリクエスト計測、SQL、jbuilderレンダリングの内訳にとても便利；以前はDatadogに頼っていたが、開発ではこちらの方がはるかに実用的
- RubyとRuby on Railsの「魔法」に頼りすぎていたと気づいた — `ActiveSupport::Concern`のような部分は謎のままだった；仕事では機能を出すこと優先で言語やフレームワークの深部まで触れなかったので、LLMと対話し、記事やソースを読みながら毎日少しずつ学ぶことにした

---

> 🌐 *Claudeによる翻訳*
