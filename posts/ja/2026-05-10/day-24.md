---
title: "Day 24"
date: "2026-05-10"
excerpt: "Shirimono のバックエンドを Render から Hetzner に Kamal で移行 — 月およそ 60 ドル節約"
author: "Tony Duong"
category: "daily"
tags: ["devops", "rails", "kamal", "hetzner", "shirimono"]
coverImage: "/images/blog/daily-cover.jpg"
---

## 今日やったこと：

- [Shirimono](https://shirimono.fun) のバックエンドを Render から Hetzner CPX21 1 台の VPS に Kamal で移行し、[Saving ~$60/month by moving from Render to Hetzner with Kamal](/ja/posts/saving-60-dollars-a-month-by-moving-from-render-to-hetzner-with-kamal) を書いた。なぜ移行したか、新しいシングルホスト構成がどう見えるか（web + Solid Queue + Postgres を 1 台に同居、Redis なし）、コストの内訳、そしてカットオーバー時間の大半を消費した 4 つの落とし穴：アンダースコア入りの Kamal サービス名が `DATABASE_URL` のパースを壊すこと、Postgres 18 の新しいデータディレクトリレイアウト、`RAILS_MASTER_KEY` を GitHub Secrets にアップロードするときの末尾改行トラップ、Rails の `HostAuthorization` が kamal-proxy のヘルスチェックを拒否する問題、を取り上げた

---
> 🌐 *Claudeによる翻訳*
